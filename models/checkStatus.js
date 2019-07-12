var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
       
module.exports = {
     	 /**
       * All the request of Check login status with Post Method 
       *
       * @param req, res
       * @return response
       */
       updatestatus: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'checkloginStatus');
              var data = [], output={};
              var SET = "";
              var input = JSON.parse(JSON.stringify(req.body));
              if(typeof input.member_no != 'undefined'){
                   SET += " member_no=?, ";
                  data.push(input.member_no);
              }
              if(typeof input.login_status != 'undefined'){
                   SET += " login_status=? ";
                   data.push(input.login_status);
              }
              QUERY = "UPDATE "+config_constant.EDUSER+" SET "+SET+" WHERE member_no="+input.member_no+" ";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                     if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                        }else{
                           output.timestamp = req.query.timestamp;
                           output.status = message.success;
                           output.comments = message.success;
                           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'checkloginStatus');
                           res.json(output);                             
                     }
                  });
            },
         }

