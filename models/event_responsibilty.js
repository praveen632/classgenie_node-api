var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var moment = require('moment-timezone');
module.exports = {
    //List of all the docs
    list:function(req,res){
	       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'event_responsibilty/list_access');
         var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var SET = "";
           if(typeof query_str.member_no != 'undefined'){
                 SET += "member_no=?, ";
                 data.push(query_str.member_no.trim());
            }        
            QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE member_no = '"+query_str.member_no+"'";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                    }
                  }
                   output.timestamp = req.query.timestamp;
                   output.status = message.success;
                   output.comments = message.success;
                   output.user_list = rows;
                   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'event_responsibilty/save_access');
                   res.json(output);
                 });            
   	},
   	//Save the doucument in collection
   	save: function(req, res){
       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/save_access');
         var input = JSON.parse(JSON.stringify(req.body));
           var data = [], output={};
           var SET = "";
           if(typeof input.responsibilty != 'undefined'){
                 SET += "responsibilty=?, ";
                 data.push(input.responsibilty.trim());
            }
             if(typeof input.member_no != 'undefined'){
                 SET += "member_no=?, ";
                 data.push(input.member_no.trim());
            }            
            SET = SET.trim().substring(0, SET.trim().length-1);            
            QUERY = "INSERT INTO "+config_constant.EVENT_RESPONSIBILITY+"  SET "+SET+",created_date=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_date="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Inserting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                    }
                  }else{
                    QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE member_no = '"+input.member_no+"'";
                    req.app.get('connection').query(QUERY, data, function(err, rows_responsibility_list, fields){
                       if(err){
                         if(config.debug){
                          req.app.get('global').fclog("Error Inserting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                          }
                        }else{
                           output.timestamp = req.query.timestamp;
                           output.status = message.success;
                           output.comments = message.success;
                           output.user_list = rows_responsibility_list;
                           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'event_responsibilty/save_access');
                           res.json(output);
                         }
                       });
                  }
                });
          },


    remove: function(req, res){
   		  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'user_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.responsibilty_id != 'undefined'){
                 SET += " responsibilty_id=?, ";
                 data.push(input.responsibilty_id.trim());
            }         
            SET = SET.trim().substring(0, SET.trim().length-1);          
            QUERY = "Delete  FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE id = '"+input.responsibilty_id+"'";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Deleting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                    }
                  }else{
                    QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE member_no = '"+input.member_no+"'";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
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
                           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'event_responsibilty/save_access');
                           res.json(output);
                         }
                       });
                  }
                });
            },


   	update: function(req, res){   		 
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'user_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
          /* if(typeof input.responsibilty_id != 'undefined'){
                 SET += " responsibilty_id=?, ";
                 data.push(input.responsibilty_id.trim());
            }
            if(typeof input.responsibilty != 'undefined'){
                 SET += " responsibilty=?, ";
                 data.push(input.responsibilty.trim());
            }
           SET = SET.trim().substring(0, SET.trim().length-1); */
           QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE id = '"+input.responsibilty_id+"' ";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                 if(config.debug){
                  req.app.get('global').fclog("Error Selecting1 : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                  }
                }
                else if(_.size(rows) > 0){
                    QUERY = "UPDATE "+config_constant.EVENT_RESPONSIBILITY+" SET responsibilty = '"+input.responsibilty+"', updated_date="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+"' WHERE id = '"+input.responsibilty_id+"'  ";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Updating : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                              }
                            }else{
                              QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE id = '"+input.responsibilty_id+"' ";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                  if(config.debug){
                                    req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                    }
                                  }else{
                                     output.timestamp = req.query.timestamp;
                                     output.status = message.success;
                                     output.comments = message.success;
                                     output.user_list = rows;
                                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'event_responsibilty/save_access');
                                     res.json(output);
                                }
                              });
                        }
                    }); 
                }else{
                   res.json({'status':message.failure, 'comments':message.nodata});
                }
           });
         }         
}