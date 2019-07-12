var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var sendmail = require('../common/sendmail');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
module.exports = {
	   /**
       * All the request of forget password with Post Method 
       *
       * @param req, res
       * @return response
       */
      forgetPassword: function(req, res){
     	     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'forgetpassword_access');
           var data = [], output={};
           var SET = "";
           var where ="WHERE 1=1";
           var input = JSON.parse(JSON.stringify(req.body));
		   console.log(input);
           if(typeof input.email != 'undefined'){
                 SET += " email=?, ";
                 data.push(input.email.trim());
            }
            if(typeof input.password != 'undefined'){
            	SET += " password=?, ";
            	data.push(md5(input.password.trim()));
            }           
            if(typeof input.confirm_password != 'undefined'){
            	SET += "confirm_password=?, ";
            	data.push(md5(input.confirm_password.trim()));
            }           
            SET = SET.trim().substring(0, SET.trim().length-1);
            if(input.password == input.confirm_password){
            	QUERY = "SELECT email FROM "+config_constant.EDUSER+" WHERE email= '"+input.email+"' and status > '-1' ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                	   if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }else if(_.size(rows) > 0){
                   	QUERY = "UPDATE "+config_constant.EDUSER+" SET password = '"+md5(input.password.trim())+"' WHERE email = '"+input.email+"' ";
                   	req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                       	if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                       }else{
                          sendmail.send({id:10, 'to':input.email}); 
                         	output.timestamp = req.query.timestamp;
                          output.status = message.success;
                          output.comments = message.success;
                          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'forgetpassword_access');
                          res.json(output);
                       }
                   	}); 
                   }
               });                
            }else{
            	res.json({'status':message.failure, 'comments':message.password_not_match});
            }
     }
}