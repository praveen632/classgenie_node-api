var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var sendmail = require('./sendmail');
var request = require('request');
module.exports = {
	   /**
       * All the request of student report with GET method.
       *
       * @param req, res
       * @return response
       */
       referTeacher: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'referteacher_access');
           var data = [], output={}; id='11';
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.to_email != 'undefined'){
           	SET += " to_email=?, ";
           	data.push(input.to_email.trim());
           }
           if(typeof input.teacher_ac_no != 'undefined'){
           	SET +=" teacher_ac_no=?, ";
           	data.push(input.teacher_ac_no.trim());
           }
           SET = SET.trim().substring(0, SET.trim().length-1);
           QUERY = "SELECT to_email FROM "+config_constant.REFERTEACHER+" WHERE to_email = '"+input.to_email+"' ";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
              	if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
              }
              else if(_.size(rows) > 0){
              	 res.json({'status':message.failure, 'comments':message.email_aready_exist});
                 return false;
              	}else{
              		QUERY = "INSERT INTO "+config_constant.REFERTEACHER+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
              		req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                     	if(config.debug){
                          req.app.get('global').fclog("Error Inserting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                     }else{
                     	request(config.api_url+'/sendmail?email='+input.to_email+'&id='+id+'&token=aforetechnical@321!', function (error, response, body) {
                     	 output.timestamp = req.query.timestamp;
	                     output.status = message.success;
	                     output.comments = message.success;
	                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'referteacher_access');
	                     res.json(output);
                     	});
                     }
                 });
              	}
              	});
       }
   }