var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
       module.exports = {
       /**
       * All the request of user with put Method 
       *
       * @param req, res
       * @return response
       */
       checkPassword: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'changepassword/update_access');
           var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var data1=[];
           var where ="WHERE 1=1";
           var SET = "";          
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.member_no !='undefined'){
            where +=" AND member_no=? ";
            data.push(input.member_no.trim());
           }
           if(typeof input.password !='undefined'){
            where +=" AND password=? ";
             data.push(md5(input.password.trim()));
           }     
           QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+" and status > '-1'";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                  if(err){
                   if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
                else if(_.size(rows)==1){
                // check newpassword and confirmpassword are same 
                if(input.newpassword == input.confirmpassword)
                {
                 if(typeof input.newpassword !='undefined'){
                    SET += "password=?, ";
                    data1.push(md5(input.newpassword.trim()));
                    }
                  }else{
                    res.json({'status':message.failure, 'comments':message.password_not_match});
              }
            }else{
               res.json({'status':message.failure, 'comments':message.wrong_old_password});
              }
              SET = SET.trim().substring(0, SET.trim().length-1);
              QUERY = "UPDATE "+config_constant.EDUSER+"  SET "+SET+" WHERE member_no='"+input.member_no+"'";
              req.app.get('connection').query(QUERY, data1, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                            }else{
                               QUERY = " SELECT * FROM "+config_constant.EDUSER+" WHERE member_no='"+input.member_no+"' and status > '-1'";
                               req.app.get('connection').query(QUERY, function(err, rows, fields){
                                if(err){
                                    if(config.debug){
                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                               }else{
                                  output.timestamp = req.query.timestamp;
                                  output.status = message.success;
                                  output.comments = message.success;
                                  output.user_list = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'changepassword/update_access');
                                  res.json(output);
                                }
                             });
                          }
                      });                
             });
      }
  }