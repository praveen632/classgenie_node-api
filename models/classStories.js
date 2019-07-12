var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var encryption = require('../common/encryption');
var fs = require('fs');
var _global = require('../common/global');
module.exports = {
       /**
       * Post in class 
       *
       * @param req, res
       * @return response
       */
        postClassStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories_access');
           var data = [], output={};
           var rows = [], rows1=[], rows2=[]; 
           var SET  = "";
           var teacher_name="";
           var input = JSON.parse(JSON.stringify(req.body));           
           if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
               }
            if(typeof input.message != 'undefined'){
                 SET += " message=?, ";
                 data.push(input.message.trim());
               }
            if(typeof input.teacher_ac_no != 'undefined'){
                  SET += " teacher_ac_no=?, ";
                  data.push(input.teacher_ac_no.trim());
                }
            if(typeof input.parent_ac_no != 'undefined'){
                  SET += " parent_ac_no=?, ";
                  data.push(input.parent_ac_no.trim());
                }      
            if(typeof input.student_no != 'undefined'){
                  SET += " student_no=?, ";
                  data.push(input.student_no.trim());
                }     
             if(typeof input.teacher_name != 'undefined'){
                  SET += " teacher_name=?, ";
                  data.push(input.teacher_name.trim());
                }          
               SET = SET.trim().substring(0, SET.trim().length-1);			   
			         // select device_id by input sender_ac_no             			  
        			 QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        		   req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
    				       if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }else{
  			  			        device_id = [];
                         _.each(rows_device_id, function(item){
  			                 if(item.device_id != 0){
  			                     device_id += ','+"'"+item.device_id+"'";
                           }
                         });
                        if(device_id != ''){
                             device_id = device_id.substring(1);
                        } 		
          						   QUERY = "INSERT INTO "+config_constant.CLASSSTORIES+"  SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                             if(err){
                                 if(config.debug){
                                      req.app.get('global').fclog("Error Inserting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                  }else{
                                    QUERY = "SELECT id, message FROM "+config_constant.CLASSSTORIES+" where id ='"+rows.insertId+"'";
                                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                    if(err){
                                      if(config.debug){
                                          req.app.get('global').fclog("Error Selecting : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                        }
                                  }else{
                                    QUERY = " SELECT class_name FROM "+config_constant.CLASSINFO+" where class_id ='"+input.class_id+"'";
                                    req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                    if(err){
                                        if(config.debug){
                                            req.app.get('global').fclog("Error Selecting : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                    }
                                    QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no ='"+input.teacher_ac_no+"' and status > '-1'";
                                    req.app.get('connection').query(QUERY, data, function(err, rows2, fields){
                                    if(err){
                                        if(config.debug){
                                              req.app.get('global').fclog("Error Selecting : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                            }
                                     }
                                    //select Parent_ac_no form input class_id and select device id through parent_ac_no.
                                    QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id ='"+input.class_id+"'";
                                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                    if(err){
                                       if(config.debug){
                                          req.app.get('global').fclog("Error Selecting : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                        }
                                     }
                                      parent_ac_no = [];
                                        _.each(rows, function(item){
                                          if(item.parent_ac_no != 0){
                                          parent_ac_no += ','+item.parent_ac_no;
                                          }
                                        });

                                       if(parent_ac_no != ''){
                                         parent_ac_no = parent_ac_no.substring(1);
                                       }  
                                    if(parent_ac_no.length > 0){
                                    // select student_ac_no according to parent_ac_no
                                    QUERY = "SELECT student_ac_no  FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                                    req.app.get('connection').query(QUERY, function(err, rows_stu_no, fields){
                                        if(err){
                                           if(config.debug){
                                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                                  res.json({error_code:1, error_msg:message.technical_error});
                                                  return false;
                                                }
                                         } 
                                          student_ac_no = [];
                                          _.each(rows_stu_no, function(item){
                                            if(item.student_ac_no != 0){
                                            student_ac_no += ','+item.student_ac_no;
                                            }
                                          });
                                          if(student_ac_no != ''){
                                             student_ac_no = student_ac_no.substring(1);
                                          }
                                       
                                     if(_.size(student_ac_no) > '0'){
                                         QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and device_id NOT IN ("+device_id+") and status = 1";
                                      }else{
                                         QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+parent_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";  
                                      }

                                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                                        if(err){
                                           if(config.debug){
                                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                                  res.json({error_code:1, error_msg:message.technical_error});
                                                  return false;
                                                }
                                         }                          
                                        if (typeof input.message == 'undefined' || input.message == "") {
                                            input.message = "New Post from Classgenie";
                                        }else{
                                            input.message = _global.cutString(input.message, 30)+'..';  
                                        }         										
                                        _.each(rows, function(item){
                                          if (config.env === 'production'){
                                              _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id});
                                          }
                                         });
                                       });
                                      });
                                  }
                                });
                                 output.status = message.success;
                                 output.comments = message.success;
                                 output.list = rows1[0];                 
                                 output.list.teacher_name = rows2;
                                 output.list.posts = rows;                       
                                 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'classstories_access');
                                 res.json(output);
                               });
                            });
                          }
                      });
                    }
                  });
				        }				  
		           });	// end device_id by sender_ac_no			  
              },

       /**
       * All the request of class stories with put Method 
       *
       * @param req, res
       * @return response
       */
       updateClassStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.message != 'undefined'){
                 SET += " message=?, ";
                 data.push(input.message.trim());
            }
            SET = SET.trim().substring(0, SET.trim().length-1);
           // select device_id by input sender_ac_no
           QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
           req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
              if(err){
                 if(config.debug){
                   req.app.get('global').fclog("Error selecting2 : %s ",err);
                   res.json({error_code:1, error_msg:message.technical_error});
                   return false;
                  }
                }else{
			            device_id = [];
                   _.each(rows_device_id, function(item){	   
                   if(item.device_id != 0){	  
                         device_id += ','+"'"+item.device_id+"'";
                    }
                  });
                  if(device_id != ''){
                   device_id = device_id.substring(1);
                  }		
                  QUERY = "UPDATE "+config_constant.CLASSSTORIES+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.id+"'";                   
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                     }
                     else
                     {
                        QUERY = "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE id='"+input.id+"'";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                              if(config.debug){
                                  req.app.get('global').fclog("Error Selecting1 : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                           }
                           else
                            {
                          //select Parent_ac_no form input class_id and select device id through parent_ac_no.
                            QUERY = "SELECT class_id FROM "+config_constant.CLASSSTORIES+" where id ='"+input.id+"'";
                            req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                            if(err){
                                if(config.debug){
                                    req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                             }
                             QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id ='"+rows1[0].class_id+"'";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                    if(config.debug){
                                        req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                 }
                                  parent_ac_no = [];
                                    _.each(rows, function(item){
                                      if(item.parent_ac_no != 0){
                                      parent_ac_no += ','+item.parent_ac_no;
                                      }
                                    });

                                   if(parent_ac_no != ''){
                                     parent_ac_no = parent_ac_no.substring(1);
                                   }  
                                 
                               if(parent_ac_no.length >0){                      
                               QUERY = "SELECT student_ac_no  FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";       
                               req.app.get('connection').query(QUERY, function(err, rows_stu_no, fields){
                                	 if(err){
                                        if(config.debug){
                                        req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                         return false;
                                  }
                           } 
                           student_ac_no = [];
                          _.each(rows_stu_no, function(item){
                            if(item.student_ac_no != 0){
                            student_ac_no += ','+item.student_ac_no;
                            }
                          });

                         if(student_ac_no != ''){
                           student_ac_no = student_ac_no.substring(1);
                         }
                         
                         if(_.size(student_ac_no) > '0'){
                              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and device_id NOT IN ("+device_id+") and status = 1";
                            }else{
                              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+parent_ac_no+") and  device_id NOT IN ("+device_id+") and status = 1";  
                            }
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                               }
                                        
                            if (typeof input.message == 'undefined' || input.message == "") {
                                  input.message = "Edit Post from Classgenie";
                              }else{
                                  input.message = _global.cutString(input.message, 30)+'..';  
                              }                             
                              _.each(rows, function(item){
                                if (config.env === 'production'){
                                    _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id});
                                }
                               });
                                });
                               });
                              }
                             });
                           });
                            output.status = message.success;
                            output.comments = message.success;
                            output.user_list = rows;
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'classstories/update_access');
                            res.json(output);
                          }
                       });
                    }
                });
				     }				  
		      });	// end device_id by sender_ac_no	
      },

      /**
       * All the request of class stories with delete Method 
       *
       * @param req, res
       * @return response
       */
      deleteClassStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/delete_access');
           var output={};
           var input = JSON.parse(JSON.stringify(req.body));
           QUERY = "DELETE FROM "+config_constant.CLASSSTORIES+" WHERE id =?";
           req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
               if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
                 QUERY = "DELETE FROM "+config_constant.CLASS_STORYLIKE+" WHERE story_id = ?";
                 req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                 if(err){
                   if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
               });
               QUERY = "DELETE FROM "+config_constant.CLASSCOMMENT+" WHERE id = ?";
               req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                  if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
               });
               QUERY = "SELECT count(class_id) as count FROM "+config_constant.CLASSSTORIES+" WHERE class_id= '"+input.class_id+"'ORDER BY id ASC ";
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
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'classstories/delete_access');
                      res.json(output);
                    }
                 });
           });
      },

     /**
     * All the request of class stories with post Method 
     *
     * @param req, res
     * @return response
     */
likesClassStories:function(req, res){
 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/likes_access');
 var data = [], output={};
 var rows = [];var likes={}; 
 var SET = "";
 var input = JSON.parse(JSON.stringify(req.body));                     
 if(typeof input.story_id != 'undefined'){
       SET += " story_id=?, ";
       data.push(input.story_id.trim());
  }
  if(typeof input.member_no != 'undefined'){
       SET += " member_no=?, ";
       data.push(input.member_no.trim());
  }
  if(typeof input.class_id != 'undefined'){
       SET += " class_id=?, ";
       data.push(input.class_id.trim());
  }
  if(typeof input.status != 'undefined'){
       SET += " status=?, ";
       data.push(input.status.trim());
  }
  if(typeof input.student_no != 'undefined'){
       SET += " student_no=?, ";
       data.push(input.student_no.trim());
  }

  SET = SET.trim().substring(0, SET.trim().length-1);               
  QUERY = "INSERT INTO "+config_constant.CLASS_STORYLIKE+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
         if(err){
          if(config.debug){
              req.app.get('global').fclog("Error Inserting : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
            }
         }
       });                                       
        //update likes in class stories table and total number of likes in class story id
        QUERY = "SELECT sum(status) as likes FROM "+config_constant.CLASS_STORYLIKE+" WHERE story_id ='"+input.story_id+"'";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
           if(err){
               if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
              }
        }else{
           QUERY = "UPDATE "+config_constant.CLASSSTORIES+" SET likes="+rows[0].likes+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.story_id+"'";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                    req.app.get('global').fclog("Error Updating : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
              }else{
                QUERY = "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE id="+input.story_id+" ";
                req.app.get('connection').query(QUERY, function(err, rows1, fields){
                if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting2 : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                  //select Parent_ac_no form input class_id and select device id through //7
                 QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no ='"+input.member_no+"' and status > '-1'";
                 req.app.get('connection').query(QUERY, data, function(err, rows2, fields){
                    if(err){
                        if(config.debug){
                             req.app.get('global').fclog("Error Selecting : %s ",err);
                             res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                        }
                   }
                     // if(input.status == '1'){
                     //  input.status = 'Like';
                     // }else if(input.status == '-1'){
                     //  input.status = 'Dislike';
                     // }                              
                      // notification for parent and student// 6
                  QUERY = "SELECT parent_ac_no, class_id FROM "+config_constant.STUDENTINFO+" where class_id ='"+input.class_id+"'";
                
                  req.app.get('connection').query(QUERY, data, function(err, rows3, fields){
                      if(err){
                         if(config.debug){
                         req.app.get('global').fclog("Error Selecting : %s ",err);
                         res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                           }
                         }                                          
                         parent_ac_no = [];
                         class_id = [];
                        _.each(rows3, function(item){
                            if(item.parent_ac_no != 0){
                              class_id = ','+"'"+item.class_id+"'";
                              parent_ac_no += ','+item.parent_ac_no;
                              }
                              });
                            if(parent_ac_no != ''){
                             parent_ac_no = parent_ac_no.substring(1);
                             }
                             if(class_id != ''){
                              class_id = class_id.substring(1);
                             }
                         
                             if(_.size(class_id) > '0'){ 
                               QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                               req.app.get('connection').query(QUERY, data, function(err, tec_rows, fields){
                                if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                      }
                                    }                   
// 5
                                  if(parent_ac_no.length > 0){
                                  // select student_ac_no according to parent_ac_no //4
                                  QUERY = "SELECT student_ac_no  FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                                  req.app.get('connection').query(QUERY, function(err, rows_stu_no, fields){
                                  if(err){
                                  if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                  }
                                  }
                                  student_ac_no = [];
                                  _.each(rows_stu_no, function(item){
                                  if(item.student_ac_no != 0){
                                  student_ac_no += ','+item.student_ac_no;
                                  }
                                  });

                                  if(student_ac_no != ''){
                                  student_ac_no = student_ac_no.substring(1);
                                  }  
                                  //3
                                  if(_.size(student_ac_no) > 0){
                                  //2
                                  QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no ='"+input.sender_ac_no+"'";
                                  req.app.get('connection').query(QUERY, data, function(err, row_device, fields){
                                  if(err){
                                  if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                   return false;
                                  }
                                  }
                                  device_id = [];
                                  _.each(row_device, function(item){
                                  if(item.device_id != 0){
                                  device_id += ','+"'"+item.device_id+"'";
                                  }
                                  });
                                  if(device_id != ''){
                                  device_id = device_id.substring(1);
                                  } 

                                 if(_.size(tec_rows) > '0'){
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+student_ac_no+") or member_no = '"+tec_rows[0]['teacher_ac_no']+"' or member_no IN ("+parent_ac_no+")  and device_id NOT IN ("+device_id+")  and status = 1";
                                 }else{
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+student_ac_no+") or member_no IN ("+parent_ac_no+")  and device_id NOT IN ("+device_id+")  and status = 1";
                                 }
                                                      
                                  // final query for notification //1             
                                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                                         if(err){
                                           if(config.debug){
                                              req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                                }
                                              }
                                             if (typeof input.message == 'undefined' || input.message == "") {
                                                  if(input.status == '1'){

                                                       input.message = "Like Post from Classgenie";
                                                     }else{
                                                      input.message = "Dislike Post from Classgenie";
                                                     }
                                                 }else{
                                                  input.message = _global.cutString(input.message, 30)+'..';
                                                }
                                                _.each(rows, function(item){
                                                if (config.env === 'production'){
                                                     _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id});
                                                  }
                                                 });
                                               });//1

                                              }); //2
                                             }//end or notifaction  //3
                                           }); //4
                                                                                    
                                          }//5
                                            });
                                          }                                        });  // 6    
                                        });   //7              
                                          output.timestamp = req.query.timestamp;
                                          output.status = message.success;
                                          output.comments = message.success;
                                          output.user_list = rows1;
                                          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'classstories/likes_access');
                                          res.json(output);
                                     
                                      }
                                   });
                                  }
                                  });
                                  }
                                  });
},

/**
* All likes list with get Method 
*
* @param req, res
* @return response
*/
likesList: function(req, res){
     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classstories/likesList_access');
     var query_str = url.parse(req.url,true).query;
     var data = [], output={};
     var where = " WHERE 1=1 ";
     var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
     var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
        if(typeof query_str.story_id != 'undefined'){
             where += " AND story_id=? ";
             data.push(query_str.story_id.trim());
         }
         if(typeof query_str.class_id != 'undefined'){
             where += " AND class_id=? ";
             data.push(query_str.class_id.trim());
         }		 
         QUERY = "SELECT *, sum(status) as status FROM "+config_constant.CLASS_STORYLIKE+" "+where+" group by member_no";
         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error Selecting1 : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
              }             
              output.like_list = [];        
              member_no = [];
              student_no = [];
             _.each(rows, function(item){
              if(item.status == '1'){
                  output.like_list.push(item);
                  member_no += ','+item.member_no;
                  if(item.member_no.toString().substring(0,1) == '4'){
                          student_no += ","+"'"+item.student_no+"'";
                       }
                     }
                 });
                if(member_no != ''){
                  member_no = member_no.substring(1);
                }	
                if(student_no != ''){
                  student_no = student_no.substring(1);
                }              
                if(_.size(member_no) > 0){
                    var item_node = {};
                  QUERY = "SELECT name, member_no, image FROM "+config_constant.EDUSER+" where member_no IN ("+member_no+") and status > '-1'";
                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                     _.each(rows, function(item, index){
                         item_node[item.member_no] = item;   
                      });
                      _.each(output.like_list, function (item, index) {
                          output.like_list[index]['name'] = item_node[item.member_no];
                      });
                      if(student_no != ''){
                            student_code = {};
                            QUERY = "SELECT * FROM  "+config_constant.STUDENTINFO+" WHERE student_no in ("+student_no+")";
                            req.app.get('connection').query(QUERY, function(err, rows, fields){
                                 _.each(rows, function(item, index){
                                    student_code[item.student_no] = item.name;;
                                });

                               _.each(output.like_list, function (item, index) {
                                    if(item.member_no.toString().substring(0,1) == '4'){
                                         if(item.student_no != ""){
                                             output.like_list[index]['student_name'] = student_code[item.student_no];
                                          }
                                          else
                                          {
                                              output.like_list[index]['student_name'] = "";
                                          }
                                      }
                               });
                              output.status = message.success;
                              output.comments = message.success;
                              res.json(output);
                          });
                        }
                        else
                        {
                             output.status = message.success;
                             output.comments = message.success;
                             res.json(output);
                        }
                  });
            }else{
               res.json({'status':message.failure, 'comments':message.nodata});
            }
         });
       },
      /**
     * All the request of class stories with post Method 
     *
     * @param req, res
     * @return response
     */
    commentClassStories:function(req, res){
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/comment_access');
               var data = [], output={};
               var SET = "";
               var input = JSON.parse(JSON.stringify(req.body));
			  
               if(typeof input.story_id != 'undefined'){
                     SET += " story_id=?, ";
                     data.push(input.story_id.trim());
                }
                if(typeof input.comment != 'undefined'){
                     SET += " comment=?, ";
                     data.push(input.comment.trim());
                }
                if(typeof input.class_id != 'undefined'){
                     SET += " class_id=?, ";
                     data.push(input.class_id.trim());
                }
                if(typeof input.member_no != 'undefined'){
                     SET += " member_no=?, ";
                     data.push(input.member_no.trim());
                } 
                if(typeof input.student_no != 'undefined'){
                     SET += " student_no=? ";
                     data.push(input.student_no.trim());
                }
              
               //Insert new comment
                QUERY = "INSERT INTO "+config_constant.CLASSCOMMENT+"  SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Inserting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                 }else{
                    //Select last inserted id   
                    QUERY = "SELECT comment,member_no FROM "+config_constant.CLASSCOMMENT+" where story_id ='"+input.story_id+"' order by id DESC limit 1";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting1 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                 }else{  
                   QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no ='"+input.member_no+"' and status > '-1'";
                   req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting2 : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                }
                QUERY = "SELECT parent_ac_no, class_id FROM "+config_constant.STUDENTINFO+" where class_id ='"+input.class_id+"'";
             
                req.app.get('connection').query(QUERY, data, function(err, row3, fields){
                      if(err){
                         if(config.debug){
                          req.app.get('global').fclog("Error Selecting3 : %s ",err);
                           res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                         }
                       }                                         
                        parent_ac_no = [];
                        class_id = [];
                        _.each(row3, function(item){
                            class_id += ','+"'"+item.class_id+"'";
                            parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                        
                         });
                        if(parent_ac_no != '')
                            {
                              parent_ac_no = parent_ac_no.substring(1);
                            }
                            if(class_id != ''){
                              class_id = class_id.substring(1);
                            }
                            if(_.size(class_id) > '0'){
                             QUERY = "SELECT teacher_ac_no  FROM "+config_constant.CLASSINFO+" where class_id IN ("+class_id+") ";
                           req.app.get('connection').query(QUERY, function(err, tech_rows, fields){
                           if(err){
                             if(config.debug){
                                    req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                               }
                          
                            //1    
                           if(_.size(parent_ac_no) > 0){
                           // select student_ac_no according to parent_ac_no //2
                           QUERY = "SELECT student_ac_no  FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                           req.app.get('connection').query(QUERY, function(err, rows_stu_no, fields){
                           if(err){
                             if(config.debug){
                                    req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                               }
                               student_ac_no = [];
                              _.each(rows_stu_no, function(item){
                                if(item.student_ac_no != 0){
                                student_ac_no += ','+item.student_ac_no;
                                }
                              });

                             if(student_ac_no != ''){
                               student_ac_no = student_ac_no.substring(1);
                             } 
                           
                             if(_.size(student_ac_no) > 0){
                                QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no ='"+input.sender_ac_no+"' AND status = '1'";
						                    req.app.get('connection').query(QUERY, data, function(err, row_device, fields){
                                   if(err){
                                      if(config.debug){
                                        req.app.get('global').fclog("Error Selecting6 : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                       }
                                      }
                                      device_id = [];
                                     _.each(row_device, function(item){
                                     if(item.device_id != 0){
                                     device_id += ','+"'"+item.device_id+"'";
                                 }
                                });
                                 if(device_id != ''){
                                       device_id = device_id.substring(1);
                                    } 
                                    if(_.size(tech_rows) > '0'){
                                   QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where  member_no IN ("+parent_ac_no+") OR member_no = '"+tech_rows[0]['teacher_ac_no']+"' OR member_no IN ("+student_ac_no+")  and device_id NOT IN ("+device_id+")  and status = 1";
                                 }else{
                                   QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where  member_no IN ("+parent_ac_no+") OR member_no IN ("+student_ac_no+")  and device_id NOT IN ("+device_id+")  and status = 1";
                                 }
                              
                                   req.app.get('connection').query(QUERY, function(err, rows, fields){
                                      if(err){
                                          if(config.debug){
                                             req.app.get('global').fclog("Error Selecting6 : %s ",err);
                                             res.json({error_code:1, error_msg:message.technical_error});
                                             return false;
                                          }
                                        }
                                       if (typeof input.message == 'undefined' || input.message == "") {
                                            input.message = "comment on your post";
                                       }else{
                                          input.message = _global.cutString(input.message, 30)+'..';  
                                       }
                                       _.each(rows, function(item){
                                       if (config.env === 'production'){
                                              _global.pushNotification({module_id:1, message:rows1[0]['name'] + ' ' + input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id});
                                       }
                                   });
                               });
                          });
                         }
                       }); //2
                    }//1
                  });
                   }

                });
                output.status = message.success;
                output.comments = message.success;
                output.comment_list = rows1[0];
                output.comment_list.comment = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'classstories/comment_access');
                res.json(output);           
          });
         } 
       });
     }
  });                      
}, 
    /**
     * All the request of class stories with post Method 
     *
     * @param req, res
     * @return response
     */
      allpostClassStories:function(req, res){ 
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/allPost_access');
               var data = [], output={}, comment_detail=[], story_id='', member_no='',  class_id='', parent_ac_no = '', teacher_ac_no='', teacher_info={}, student_name = {}, story_detail = {}, class_name={} ;
               var teacher_name = "";
               var input = JSON.parse(JSON.stringify(req.body));
               var page_size = req.app.get('config').page_size;
               var start_record_index = (input.page_number - 1) *page_size;
               var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
                var where = " WHERE 1=1 ";	
                var where1 = " WHERE 1=1 ";		        
                if(typeof input.name != 'undefined' && typeof input.name != ""){                   
                      where += " AND (teacher_name Like '"+'%'+input.name+ '%' + "' OR username Like '"+'%'+input.name+ '%' + "')"; 
                 }
                 if(typeof input.class_id != 'undefined'){
                       if(input.class_id.indexOf(',')>-1){
                             var arr = input.class_id.split(",");
                               _.each(arr, function(item){
                                  class_id += ','+"'"+item+"'";
                                 });
                             if(class_id != ''){
                                 class_id = class_id.substring(1);
                              }
                             where += " AND (class_id IN ("+class_id+")) "; 
      					             where1 +=  " AND (class_id IN ("+class_id+")) "; 
  					            }
                       else
                       {
                         where += " AND class_id IN (?) ";
                         data.push(input.class_id.trim());
                       }
                }

		           if(typeof input.parent_ac_no != 'undefined'){
                
                    if(input.parent_ac_no.indexOf(',')>-1){
                      var arr = input.parent_ac_no.split(",");
                      _.each(arr, function(item){
                       parent_ac_no += ','+"'"+item+"'";   
                      });
                      if(parent_ac_no != ''){
                        parent_ac_no = parent_ac_no.substring(1);
                      }
                      where += " AND parent_ac_no IN ("+parent_ac_no+") ";
                    }else{
                         where += " AND parent_ac_no IN (?)";
                         data.push(input.parent_ac_no.trim());
                       }
                     if(typeof input.student_no != 'undefined'){
                       where += " AND student_no IN (?)";
                       data.push(input.student_no.trim());
                     }  
                }
               
                if(typeof input.source != 'undefined' && input.source=='ac'){
                    where += " AND parent_ac_no='0' ";
                }
               
                //Select class id   
                 QUERY = "SELECT *,date_format(created_at, '%b, %d %Y %h:%i %p') as 'date', SUBSTR(image,LOCATE('.',image)+1) as ext, CONCAT(image,'$',rand()) as image_new FROM " +config_constant.CLASSSTORIES +where+"  order by id DESC "+limit+"";
				         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                        if(config.debug){
                              req.app.get('global').fclog("Error Selecting1 : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                                        
                       if(_.size(rows) > 0 ){
                       // select story_id from classstory
                        output.posts = [];
                        student_no = [];
                        _.each(rows, function(obj){
                          output.posts.push(obj);
                          story_id += ','+obj.id;
      			              teacher_ac_no += ','+obj.teacher_ac_no;
                          student_no +=','+"'"+obj.student_no+"'";
                        });                        
                        if(story_id != ''){
                           story_id = story_id.substring(1);
                         }             
			                   if(teacher_ac_no != ''){
                         teacher_ac_no = teacher_ac_no.substring(1);
                     }  
                       if(student_no != ''){
                         student_no = student_no.substring(1);
                     }    
                     QUERY = "SELECT member_no, name, image FROM "+config_constant.EDUSER+" where member_no in ("+teacher_ac_no+")";
					 
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting2 : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                       _.each(rows, function(item){
      		             teacher_info[item.member_no] = item;
      		          });
                 });
                     //Select student name  
                     QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" where student_no in ("+student_no+")";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting2 : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                        
                       _.each(rows, function(item){
                       student_name[item.student_no] = item;
                    });
                });            
                 QUERY = " SELECT class_name, class_id,grade FROM "+config_constant.CLASSINFO+" "+where1+"";
			           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting3 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }		  
				              _.each(rows, function(item){
      		               class_name[item.class_id] = item;
      		          });					 
                });         
                  QUERY = " SELECT * FROM "+config_constant.CLASSCOMMENT+" WHERE story_id IN ("+story_id+") order by id";
				          req.app.get('connection').query(QUERY, function(err, rows, fields){
                   if(err){
                      res.json({'status':message.failure, 'comments':"No Post Available"});
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting4 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }
                   _.each(rows, function(item){
                         if(typeof story_detail[item.story_id] == "undefined") {
                            story_detail[item.story_id] = [];  
                         }
                        story_detail[item.story_id].push(item);
                    });

                    // For like status
                    QUERY = "SELECT sum(status) as status, story_id, member_no FROM "+config_constant.CLASS_STORYLIKE+" where story_id IN ("+story_id+") and member_no='"+input.member_no+"' GROUP BY story_id, member_no";
					          req.app.get('connection').query(QUERY, function(err, rows1, fields){
                      if(err){
                          if(config.debug){
                               req.app.get('global').fclog("Error Selecting5 : %s ",err);
                               res.json({error_code:1, error_msg:message.technical_error});
                               return false;
                        }
                    }                    
                    var story_status = {};
                    _.each(rows1, function(item){
                         if(typeof story_status[item.story_id] == "undefined") {
                            story_status[item.story_id] = [];  
                         }
                         story_status[item.story_id].push(item);
                     });
                     // coments detail with comments count					
                     _.each(output.posts, function(item, index){
					            output.posts[index]['comment_detail'] = story_detail[item.id];
                      output.posts[index]['comment_count'] = _.size(story_detail[item.id]);
                      output.posts[index]['status'] = story_status[item.id];
					            output.posts[index]['class_name'] = class_name[item.class_id];
				              output.posts[index]['teacher_name'] = teacher_info[item.teacher_ac_no];
                      output.posts[index]['student_name'] = student_name[item.student_no];
                   });				   
                     output.status = message.success;
                     output.comments = message.success;
                     res.json(output);
                    });
                  });                 
                }else{
                  output.status = message.failure;
                  output.comments = message.nodata;
                   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/allPost_access');
                  res.json(output);
                }
              });
           },


 // Display All Comment with name for single post
 allcommentClassStories:function(req, res){
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/commentDetail_access');
               var data = [], output={}, member_name=[], name = [];
               var SET = "";
               var input = JSON.parse(JSON.stringify(req.body));
               if(typeof input.story_id != 'undefined'){
                     SET += " story_id=? ";
                  }
                  // select story Detail by story ID
                  QUERY = "SELECT *, SUBSTR(image,LOCATE('.',image)+1) as ext FROM "+config_constant.CLASSSTORIES+" where id=?";
                  req.app.get('connection').query(QUERY, input.story_id, function(err, rows, fields){
                  if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting3 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                  }                 
                  output.post = rows;
                  var teacher_name= "";
                  QUERY = "SELECT image, name FROM "+config_constant.EDUSER+" where member_no='"+rows[0]['teacher_ac_no']+"'";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                  if(err){
                     if(config.debug)
                          req.app.get('global').fclog("Error Selecting2 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                   }
                   output.teacher_name= rows;
                   // select comment by story id
                   QUERY ="SELECT id, story_id, comment, class_id, member_no, student_no FROM "+config_constant.CLASSCOMMENT+" where story_id = '"+input.story_id+"'";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting1 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                  }
                  
                  var comment_list = {}, member_no='', student_no='';
                     output.comment_list=[];
                  _.each(rows, function(item){
                     output.comment_list.push(item);
                     member_no += ','+item.member_no;
                     if(item.member_no.toString().substring(0,1) == '4'){
                        student_no += ",'"+item.student_no+"'";
                     }
                    });
                   if(member_no != ''){
                      member_no = member_no.substring(1);
                   }
                   if(student_no != ''){
                      student_no = student_no.substring(1);
                   }
                  // select comment by story id
                  if(_.size(rows) > 0){
                      var item_node = {};
                      QUERY = "SELECT name, member_no, image FROM "+config_constant.EDUSER+" where member_no IN ("+member_no+") and status > '-1'";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                         _.each(rows, function(item, index){
                             item_node[item.member_no] = item;   
                          });
                          _.each(output.comment_list, function (item, index) {
                              output.comment_list[index]['name'] = item_node[item.member_no];
                          });
                          if(student_no != ''){
                                student_code = {};
                                QUERY = "SELECT * FROM  "+config_constant.STUDENTINFO+" WHERE student_no in ("+student_no+")";
                                req.app.get('connection').query(QUERY, function(err, rows, fields){
                                     _.each(rows, function(item, index){
                                        student_code[item.student_no] = item.name;;
                                    });

                                   _.each(output.comment_list, function (item, index) {
                                        if(item.member_no.toString().substring(0,1) == '4'){
                                             if(item.student_no != ""){
                                                 output.comment_list[index]['student_name'] = student_code[item.student_no];
                                              }
                                              else
                                              {
                                                  output.comment_list[index]['student_name'] = "";
                                              }
                                          }
                                   });
                                  output.status = message.success;
                                  output.comments = message.success;
                                  res.json(output);
                              });
                            }
                            else
                            {
                                 output.status = message.success;
                                 output.comments = message.success;
                                 res.json(output);
                            }
                      });
                  }else{
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);
               }
                });

              });
            });
       },

// return class_id  for parentclassstories
parentstories: function(req, res){
     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'parentstories_access');
     var data = [], output={}, story_id = []; teacher_ac_no = [];
     var SET = "";
     var input = JSON.parse(JSON.stringify(req.body));
     if(typeof input.parent_ac_no != 'undefined'){
           SET += " parent_ac_no=?, ";
           data.push(input.parent_ac_no.trim());
      }
      SET = SET.trim().substring(0, SET.trim().length-1);
      QUERY = "SELECT DISTINCT class_id FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+input.parent_ac_no+"' ";
      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
         if(err){
          if(config.debug){
            req.app.get('global').fclog("Error Selecting : %s ",err);
            res.json({error_code:1, error_msg:message.technical_error});
            return false;
          }
         }
         if(_.size(rows) > 0){
          class_id = [];
          _.each(rows, function(item){
              class_id +=','+item.class_id;              
          });
          if(class_id != ''){
            class_id = class_id.substring(1);                 
          }
         output.class_id = class_id;
         output.status = message.success;
         output.comments = message.success;
         res.json(output);
         }else{
         output.status = message.failure;
         output.comments = message.nodata;
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'parentstories_access');
         res.json(output);
       }
     });
    },

    /**
     * Delete comment in class story. 
     *
     * @param req, res
     * @return response
     */
    deleteComment: function(req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/comment/delete_access');
         var data = [], output={}, story_id = []; teacher_ac_no = [];
         var SET = "";
         var input = JSON.parse(JSON.stringify(req.body));
         if (typeof input.id != 'undefined') {
          SET += " id=?, ";
          data.push(input.id.trim());
         }
         SET = SET.trim().substring(0, SET.trim().length-1);
         QUERY = "DELETE FROM "+config_constant.CLASSCOMMENT+" WHERE id = '"+input.id+"' ";
         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if (err) {
              if (config.debug) {
                req.app.get('global').fclog("Error in Deleting : %s",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
             } else {
              output.status = message.success;
              output.comments = message.success;
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/comment/delete_access');
              res.json(output);
             }
         });  
    },

/**
     * Search for Class stories list. 
     *
     * @param req, res
     * @return response
     */

    classStoriesList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'classstories/list_access');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {};
        var page_size = req.app.get('config').page_size;
        var start_record_index = (query_str.page_number - 1) * page_size;
        var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
         if (query_str.parent_ac_no == '' || query_str.student_no == '') {
            QUERY = "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE class_id = '"+query_str.class_id+"' AND parent_ac_no = '0' ";
            } else {
              QUERY = "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE class_id = '"+query_str.class_id+"' AND parent_ac_no <> '0' AND student_no = '"+query_str.student_no+"'";
              } 
            req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
             if (err) {
             if (config.debug) {
             req.app.get('global').fclog("Error Selecting1 : %s ", err);
             res.json({error_code: 1, error_msg: message.technical_error});
                return false;
               }
            } else {
             output.status = message.success;
             output.classstory = rows;
             output.comments = message.success;
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/comment/delete_access');
            res.json(output);
         }
         });
       },


    /**
     * Search for Class stories for the getting the classes on parent module. 
     *
     * @param req, res
     * @return response
     */
     student_classStories_List: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, '/classstories_student/list_access');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {};
        var page_size = req.app.get('config').page_size;
        var start_record_index = (query_str.page_number - 1) * page_size;
        var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
        //select the classid for extracting the class list based on student no        
         QUERY= "SELECT class_id FROM "+config_constant.CLASSSTORIES+" WHERE student_no = '"+query_str.student_no+"'";
         req.app.get('connection').query(QUERY, data, function (err, rows_student_class_id, fields) {
             if (err) {
                if (config.debug) {
                     req.app.get('global').fclog("Error Selecting1 : %s ", err);
                     res.json({error_code: 1, error_msg: message.technical_error});
                     return false;
                }
            }             
             class_id = [];
            _.each(rows_student_class_id, function(item){
            if (item.class_id != 0) {
              class_id += ",'"+item.class_id+"'";
              }
            });
            if (class_id != '') {
               class_id = class_id.substring(1);
            }   
           //getting the class info from the class id based on student no    
           QUERY= "SELECT * FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+")";
           req.app.get('connection').query(QUERY, data, function (err, rows_class_details, fields) {
             if (err) {
             if (config.debug) {
             req.app.get('global').fclog("Error Selecting1 : %s ", err);
             res.json({error_code: 1, error_msg: message.technical_error});
                return false;
                }
               } else {
             output.status = message.success;
             output.classstory = rows_class_details;
             output.comments = message.success;
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/comment/delete_access');
            res.json(output);
         }
      });
    });
         
    },

/**
     * Parent kid list in class story. 
     *
     * @param req, res
     * @return response
     */
     mykidslist: function(req,res) {
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/mykidlist');
      var query_str = url.parse(req.url,true).query;
      var data = [], output={};
      var SET = "";
      var where = " WHERE 1=1 ";
     if (typeof query_str.parent_ac_no != 'undefined') {
           SET += " parent_ac_no=?, ";
           data.push(query_str.parent_ac_no.trim());
        }
         QUERY = "SELECT id,name FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+query_str.parent_ac_no+"' ";
         req.app.get('connection').query(QUERY, function(err, rows, fields){
         if (err) {
          if (config.debug) {
            req.app.get('global').fclog("Error Selecting1 : %s ",err);
            res.json({error_code:1, error_msg:message.technical_error});
            return false;
           }
         }
            studentinfo_id_u = '';
            output.studentinfo_id = [];
           _.each(rows, function(item){
            output.studentinfo_id.push(item);
            if (item.id != 0) {
            studentinfo_id_u += ",'"+item.id+"'";
              }
            });
            if (studentinfo_id_u != '') {
               studentinfo_id_u = studentinfo_id_u.substring(1);
               }  

           QUERY= "SELECT student_ac_no,student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_info_id IN ("+studentinfo_id_u+")";
           req.app.get('connection').query(QUERY, data, function (err, rows_member_number, fields) {
             if (err) {
             if (config.debug) {
             req.app.get('global').fclog("Error Selecting1 : %s ", err);
             res.json({error_code: 1, error_msg: message.technical_error});
                return false;
                }
               } 
          else {
            var member_number_details_node = [];
             _.each(rows_member_number, function (item) {
             if (typeof member_number_details_node[item.student_info_id] == "undefined") {
                member_number_details_node[item.student_info_id] = [];
                }
                member_number_details_node[item.student_info_id].push(item);                          
                });
              _.each(output.studentinfo_id, function (item, index) {
              if (typeof member_number_details_node[item.id] != 'undefined') {
                output.studentinfo_id[index]['details'] = member_number_details_node[item.id];
                 } else {
                 output.studentinfo_id[index]['details'] = [];
                 }
                });
               output.status = message.success;
               output.comments = message.success;
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/mykidlist');
               res.json(output);
            }
        });  
    });
  },

  /**
     * Class list based on student ac number. 
     *
     * @param req, res
     * @return response
     */
     studentClasslist: function(req,res) {
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, '/classstories/studentClasslist');
      var query_str = url.parse(req.url,true).query;
      var data = [], output={};
      var SET = "";
      var where = " WHERE 1=1 ";
     if (typeof query_str.student_ac_no != 'undefined') {
           SET += " student_ac_no=?, ";
           data.push(query_str.student_ac_no.trim());
        }
         QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no = '"+query_str.student_ac_no+"' ";
         
         req.app.get('connection').query(QUERY, function(err, rows_student_info_id, fields){
         if (err) {
          if (config.debug) {
            req.app.get('global').fclog("Error Selecting1 : %s ",err);
            res.json({error_code:1, error_msg:message.technical_error});
            return false;
           }
         }
            student_info_id = [];
            _.each(rows_student_info_id, function(item){
            if (item.student_info_id != 0) {
              student_info_id += ",'"+item.student_info_id+"'";
              }
            });
            if (student_info_id != '') {
               student_info_id = student_info_id.substring(1);
               }   
         
           QUERY= "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+student_info_id+")";
           req.app.get('connection').query(QUERY, data, function (err, rows_student_class_id, fields) {
            if (err) {
             if (config.debug) {
             req.app.get('global').fclog("Error Selecting1 : %s ", err);
             res.json({error_code: 1, error_msg: message.technical_error});
              return false;
                }
               }

               class_id = [];
            _.each(rows_student_class_id, function(item){
            if (item.class_id != 0) {
                class_id += ",'"+item.class_id+"'";
              }
            });
            if (class_id != '') {
               class_id = class_id.substring(1);
               }  
          QUERY= "SELECT class_name,class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+")";
            req.app.get('connection').query(QUERY, data, function (err, rows_student_class_details, fields) {
            if (err) {
             if (config.debug) {
             req.app.get('global').fclog("Error Selecting1 : %s ", err);
             res.json({error_code: 1, error_msg: message.technical_error});
              return false;
                }
               } else {
               output.class_details = rows_student_class_details;
               output.status = message.success;
               output.comments = message.success;
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/classstories/studentClasslist');
               res.json(output);
            }
        });  
     });
   });
  },

 /**
     * classes based on student_ac_no. 
     *
     * @param req, res
     * @return response
     */
     studentClasslist: function(req,res) {
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, '/classstories/studentClasslist');
      var query_str = url.parse(req.url,true).query;
      var data = [], output={};
      var SET = "";
      var where = " WHERE 1=1 ";
      if (typeof query_str.student_ac_no != 'undefined') {
           SET += " student_ac_no=?, ";
           data.push(query_str.student_ac_no.trim());
        }
         QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no = '"+query_str.student_ac_no+"' ";
         req.app.get('connection').query(QUERY, function(err, rows_student_info_id, fields){
             if (err) {
              if (config.debug) {
                req.app.get('global').fclog("Error Selecting1 : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
               }
             }
            student_info_id = [];
            _.each(rows_student_info_id, function(item){
            if (item.student_info_id != 0) {
              student_info_id += ",'"+item.student_info_id+"'";
              }
            });
            if (student_info_id != '') {
               student_info_id = student_info_id.substring(1);
           }        
           QUERY= "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+student_info_id+")";
           req.app.get('connection').query(QUERY, data, function (err, rows_student_class_id, fields) {
              if (err) {
                 if (config.debug) {
                     req.app.get('global').fclog("Error Selecting1 : %s ", err);
                     res.json({error_code: 1, error_msg: message.technical_error});
                     return false;
                }
               }
               class_id = [];
              _.each(rows_student_class_id, function(item){
               if (item.class_id != 0) {
                  class_id += ",'"+item.class_id+"'";
              }
            });
            if (class_id != '') {
               class_id = class_id.substring(1);
            }  
            QUERY= "SELECT class_name,class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+")";
            req.app.get('connection').query(QUERY, data, function (err, rows_student_class_details, fields) {
                if (err) {
                     if (config.debug) {
                         req.app.get('global').fclog("Error Selecting1 : %s ", err);
                         res.json({error_code: 1, error_msg: message.technical_error});
                          return false;
                    }
                  }else{
                   output.class_details = rows_student_class_details;
                   output.status = message.success;
                   output.comments = message.success;
                   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/classstories/studentClasslist');
                   res.json(output);
            }
        });  
     });
   });
  },

  /**
   * classStories based on student_ac_no and class_id. 
   *
   * @param req, res
   * @return response
   */
     studentClassStories: function(req,res) {
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, '/classstories/studentClasslist');
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var SET = "";
          var where = " WHERE 1=1 ";
           if (typeof query_str.student_ac_no != 'undefined') {
                 SET += " student_ac_no=?, ";
                 data.push(query_str.student_ac_no.trim());
              }
            if (typeof query_str.class_id != 'undefined') {
                 SET += " class_id=?, ";
                 data.push(query_str.class_id.trim());
              }  
              QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no = '"+query_str.student_ac_no+"' ";
              req.app.get('connection').query(QUERY, function(err, rows_student_info_id, fields){
                 if (err) {
                    if (config.debug) {
                      req.app.get('global').fclog("Error Selecting1 : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                     }
                   }
                  student_info_id = [];
                  _.each(rows_student_info_id, function(item){
                  if (item.student_info_id != 0) {
                        student_info_id += ",'"+item.student_info_id+"'";
                    }
                  });
                  if (student_info_id != '') {
                     student_info_id = student_info_id.substring(1);
                   }         
                   QUERY= "SELECT student_no FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+student_info_id+")";
                   req.app.get('connection').query(QUERY, data, function (err, rows_student_no, fields) {
                        if (err) {
                         if (config.debug) {
                         req.app.get('global').fclog("Error Selecting1 : %s ", err);
                         res.json({error_code: 1, error_msg: message.technical_error});
                         return false;
                        }
                       }
                       student_no = [];
                    _.each(rows_student_no, function(item){
                    if (item.student_no != 0) {
                        student_no += ",'"+item.student_no+"'";
                      }
                    });
                    if (student_no != '') {
                       student_no = student_no.substring(1);
                    }  
                    QUERY= "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE class_id = '"+query_str.class_id+"' AND student_no IN ("+student_no+")";
                    req.app.get('connection').query(QUERY, data, function (err, rows_student_class_stories, fields) {
                      if (err) {
                       if (config.debug) {
                             req.app.get('global').fclog("Error Selecting1 : %s ", err);
                             res.json({error_code: 1, error_msg: message.technical_error});
                              return false;
                          }
                         } else {
                             output.stories = rows_student_class_stories;
                             output.status = message.success;
                             output.comments = message.success;
                             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/classstories/studentClasslist');
                             res.json(output);
                          }
                      });  
                   });
                 });
                }
              } 


    

   