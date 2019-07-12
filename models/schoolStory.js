var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/' + (config.env == 'development' ? 'message' : 'message.min') + '.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var moment = require('moment-timezone');
var fs = require('fs');
module.exports = {
      /**
        * Post School Story.
        *
        * @param req, res
        * @return response
        */
        postSchoolStory: function (req, res){
           var input = JSON.parse(JSON.stringify(req.body));
		       var output={};var data = '';var teacher_ac_no=0;var img1 = ''; var school_id = '';
             if (!req.file) {
                    if(config.debug)
                      req.app.get('global').fclog("No file was uploaded");
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
             }
             var file = req.file;             
             var name = file.originalname.split('.');
             if(file.size>20*1024*1024){
                  fs.unlinkSync(file.path);
                  res.json({err:'File greater than 20mb is not allowed'});
                  return false;
             }
            if(name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'mp4' || name[1] == '3gp'){
              var data = fs.readFileSync(file.path);            
            fs.writeFile(config.upload_path+'/school_stories/'+file.originalname, data, function(err){
              if (err) {
                    res.json({err:'Input File Error'});
                    return false;
                 }
                 var img = '';
                   if(input.teacher_ac_no!=''){
                      teacher_ac_no = input.teacher_ac_no;
                        }
                      if(input.teacher_name!=''){
                      teacher_name = input.teacher_name;
                        }
                   if(input.school_id != 0){
                      school_id = input.school_id;
                        }
                   if(typeof input.message != 'undefined'){
                     var  message= input.message;                           
                    }else{
                     var  message= "";
                  }
                  QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
                  req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
                     if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error selecting1 : %s ",err);
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
                   QUERY =  "INSERT INTO "+config_constant.SCHOOLSTORY+" SET image="+"'"+img+"'" +",message= "+"'"+message+"'"+",school_id= "+"'"+input.school_id+"'"+",teacher_name= "+"'"+input.teacher_name+"'"+",teacher_ac_no= "+"'"+input.teacher_ac_no+"'"+", created_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'"; 
                   req.app.get('connection').query(QUERY, function(err, rows, fields){
                   var id = rows['insertId'];
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Inserting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                        } 
                        if(name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg'){   
                          img1 = 'image_'+id+'.'+name[1];   
                             }
                        if(name[1] == 'mp4' || name[1] == '3gp'){
                           img1 = 'vedio_'+id+'.'+name[1];                    
                          }                  
                        fs.rename(config.upload_path+'/school_stories/'+file.originalname, config.upload_path+'/school_stories/'+img1, function(err) {
                        if ( err ) {
                               if(config.debug){
                                  req.app.get('global').fclog("Error in rename : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                              }                          
                    });                  
                     QUERY = "UPDATE "+config_constant.SCHOOLSTORY+" SET image="+"'"+img1+"'" +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
                     req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Updating : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                          }else{
                            QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+input.school_id+"'";
                            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                               if(config.debug){
                                req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                            class_id = [];
                              _.each(rows, function(item){
                                 class_id +=','+"'"+item.class_id+"'"; 
                              });
                              if(class_id != ''){
                                class_id = class_id.substring(1);
                              }
                             QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                 if(config.debug){
                                    req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                              }
                           }else{
                            parent_ac_no = [];
                              _.each(rows, function(item){
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                              });
                              if(parent_ac_no != ''){
                                parent_ac_no = parent_ac_no.substring(1);
                              }
                               QUERY = "SELECT student_ac_no FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                }
                             }else{
                              student_ac_no = [];
                              _.each(rows, function(item){
                                 student_ac_no += ','+"'"+item.student_ac_no+"'"; 
                              });
                              if(student_ac_no != ''){
                                student_ac_no = student_ac_no.substring(1);
                              }
                          //select Member_no form input school_id and select device id through Member_no.
                           QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+input.school_id+"'";
                           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                              if(config.debug){
                                 req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                 res.json({error_code:1, error_msg:message.technical_error});
                                 return false;
                                }
						                   }
                               member_no = [];           
                               _.each(rows, function(item){
                                 if(item.member_no != 0){
                                 member_no += ','+"'"+item.member_no+"'";
                                 }
                               });                              
                                if(member_no != ''){
                                  member_no = member_no.substring(1);
                                }
                               
                             if(_.size(device_id) > 0){								
                               if(_.size(member_no) > 0){                                 
                                   QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                               }else{
                                 QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
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
                                     _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id, member_no:member_no});
                                  }
                                });
                             }); 
							 }							 
                          });
						  
                            output.timestamp = req.query.timestamp;
                            output.status ="Success";
                            output.comments = "Success";
                            res.json(output);
                          }
                        });
                      }
                    });
                   }
                 });
                 }
               });                       
              });
               if (fs.existsSync(config.upload_path+'/school_stories/'+img1)) {
                  fs.unlinkSync(file.path);
                 }
              }
           });// end divice id
       });
    }else{
      res.json({err:'Invalid file format!'});
      return false;
     }
   },
             /**
              * Post School Story.
              *
              * @param req, res
              * @return response
              */
      updatepostSchoolStory: function (req, res){            
           var input = JSON.parse(JSON.stringify(req.body));          
           var output={};
           var data = '';var parent_ac_no=0;var student_no=0;var img1 = '';
           if (!req.file) {
                  if(config.debug){
                        req.app.get('global').fclog("No file was uploaded");
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                  }
                 var file = req.file;
                 var name = file.originalname.split('.');
                 if(file.size>20*1024*1024){
                      fs.unlinkSync(file.path);
                      res.json({err:'File greater than 20mb is not allowed'});
                      return false;
                      
                     }
                  if(name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'mp4' || name[1] == '3gp'){
                  var data = fs.readFileSync(file.path);            
                  fs.writeFile(config.upload_path+'/school_stories/'+file.originalname, data, function(err){
                    if (err) {
                      res.json({err:'Input File Error'});
                      return false;
                 }
                  var img = '';
                  if(input.id!=''){
                       var id = input.id;
                    }
                    if(name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg'){   
                      img = 'image_'+id+'.'+name[1];   
                         }
                    if(name[1] == 'mp4' || name[1] == '3gp'){
                       img = 'vedio_'+id+'.'+name[1];                    
                      }                  
                     fs.rename(config.upload_path+'/school_stories/'+file.originalname, config.upload_path+'/school_stories/'+img, function(err) {
                     if (err){
                           req.app.get('global').fclog("Error In rename : %s ",err);
                           return false;
                       }
                     }); 
                     if(typeof input.message != 'undefined'){
                       var  message= input.message;                           
                      }else{
                       var  message= "";
                     } 
                     QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
                     req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
                         if(err){
                           if(config.debug){
                                req.app.get('global').fclog("Error selecting1 : %s ",err);
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
                      QUERY = "UPDATE "+config_constant.SCHOOLSTORY+" SET image="+"'"+img+"'" +", message="+"'"+message+"'" +",updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
                      req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                        if(err){
                            if(config.debug){
                                  req.app.get('global').fclog("Error Updating : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                              }else{
                                QUERY = "SELECT school_id FROM "+config_constant.SCHOOLSTORY+" WHERE id = '"+input.id+"' ";
                                req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                    if(err){
                                      if(config.debug){
                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                    }else{
                                      QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+rows1[0]['school_id']+"'";
                                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                      if(err){
                                         if(config.debug){
                                          req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                        }
                                     }else{
                                      class_id = [];
                                        _.each(rows, function(item){
                                           class_id +=','+"'"+item.class_id+"'"; 
                                        });
                                        if(class_id != ''){
                                          class_id = class_id.substring(1);
                                        }
                                       QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                         if(err){
                                           if(config.debug){
                                              req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                        }
                                     }else{
                                      parent_ac_no = [];
                                        _.each(rows, function(item){
                                          parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                                        });
                                        if(parent_ac_no != ''){
                                          parent_ac_no = parent_ac_no.substring(1);
                                        }
                                         QUERY = "SELECT student_ac_no FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                           if(err){
                                             if(config.debug){
                                                req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                                res.json({error_code:1, error_msg:message.technical_error});
                                                return false;
                                          }
                                       }else{
                                        student_ac_no = [];
                                        _.each(rows, function(item){
                                           student_ac_no += ','+"'"+item.student_ac_no+"'"; 
                                        });
                                        if(student_ac_no != ''){
                                          student_ac_no = student_ac_no.substring(1);
                                        }
                                      //select Member_no form input school_id and select device id through Member_no.
                                      QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+rows1[0]['school_id']+"' ";
                                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                      if(err){
                                         if(config.debug){
                                            req.app.get('global').fclog("Error Selecting1 : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                       }                      
                                       member_no = [];                     
                                      _.each(rows, function(item){
                                        if(item.member_no != 0){
                                        member_no += ','+"'"+item.member_no+"'";
                                      }
                                      });                                      
                                     if(member_no != ''){
                                       member_no = member_no.substring(1);
                                     }
                                    if(_.size(device_id) > 0){                                  
                                    if(_.size(member_no) > 0){                                 
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 }else{
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
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
                                        input.message = "Post Update from Classgenie";
                                    }else{
                  						          input.message = _global.cutString(input.message, 30)+'..';  
                  									}   
                                    _.each(rows, function(item){
                                      if (config.env === 'production'){
                                        _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id, member_no:member_no});
                                        }
                                       });
                                     });
                                  }
                                 });
                                  }
                                });
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                res.json(output);
                              }
                            });
                            }
                          });
                         }
                        });
                       }                           
                         });                        
                         if (fs.existsSync(config.upload_path+'/school_stories/'+img)) {
                          fs.unlinkSync(file.path);
                           }
                         }
                       });
                      }); 
                    }else{
                        res.json({err:'Invalid file format!'});
                        return false;
                      }  
           },

        /**
        * Post School Story.
        *
        * @param req, res
        * @return response
        */
        likeSchoolStory: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'school/like_access');
           var data = [], output={};
           var rows = [];
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.story_id != 'undefined'){
            SET += " story_id=?, ";
            data.push(input.story_id.trim());
           }
           if(typeof input.member_no != 'undefined'){
            SET +=" member_no=?, ";
            data.push(input.member_no.trim());
           }
           if(typeof input.school_id != 'undefined'){
            SET +=" school_id=?, ";
            data.push(input.school_id.trim());
           }
           if(typeof input.status != 'undefined'){
            SET +=" status=?, ";
            data.push(input.status.trim());
           }
         console.log(input);
           SET = SET.trim().substring(0, SET.trim().length-1);
           QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
		   console.log(QUERY);
           req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
             if(err){
               if(config.debug){
                    req.app.get('global').fclog("Error selecting1 : %s ",err);
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
                  QUERY = "INSERT INTO "+config_constant.SCHOOLSTORYLIKE+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
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
                QUERY = "SELECT sum(status) as likes FROM "+config_constant.SCHOOLSTORYLIKE+" WHERE story_id ='"+input.story_id+"'";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Selecting1 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                      }
                }else{
                   QUERY = "UPDATE "+config_constant.SCHOOLSTORY+" SET likes="+rows[0].likes+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.story_id+"'";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                           if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }else{
                              QUERY = "SELECT * FROM "+config_constant.SCHOOLSTORY+" WHERE id="+input.story_id+" ";
                              req.app.get('connection').query(QUERY, function(err, rows1, fields){
                              if(err){
                                if(config.debug){
                                    req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                              }else{                                
                              QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+input.school_id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                                 if(config.debug){
                                  req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                             }else{
                               class_id = [];
                                _.each(rows, function(item){
                                   class_id +=','+"'"+item.class_id+"'"; 
                                });
                                if(class_id != ''){
                                  class_id = class_id.substring(1);
                                }
                               QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting6 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                }
                             }else{
                              parent_ac_no = [];
                                _.each(rows, function(item){
                                  parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                                });
                                if(parent_ac_no != ''){
                                  parent_ac_no = parent_ac_no.substring(1);
                                }
                                // //select Member_no form input school_id and select device id through Member_no.
                                 QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+input.school_id+"'";
                                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                    if(config.debug){
                                       req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                       res.json({error_code:1, error_msg:message.technical_error});
                                       return false;
                                      }
                                     }
                                     member_no = [];
                                     _.each(rows, function(item){
                                       if(item.member_no != 0){
                                       member_no += ','+"'"+item.member_no+"'";
                                      }
                                     });                                  
                                    if(member_no != ''){
                                      member_no = member_no.substring(1);
                                    }
                                 if(_.size(device_id) > 0){									 
                                     if(_.size(member_no) > 0){                                 
                                     QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                   }else{
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                   }
                             
                                   req.app.get('connection').query(QUERY, function(err, rows, fields){
                                    if(err){
                                       if(config.debug){
                                              req.app.get('global').fclog("Error Selecting8 : %s ",err);
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
                                         _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id, member_no:member_no});
                                      }
                                    });
                                 });
								 
								 }
								 
                                  output.timestamp = req.query.timestamp;
                                  output.status = message.success;
                                  output.comments = message.success;
                                  output.user_list = rows1;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'school/like_access');
                                  res.json(output);
								  console.log(output);
                                });
                                }
                              });
                             }
                           });
                         }
                       });
                      }
                   });
                  }
               });           
          }
         });
        },
        /**
        * Post School Story.
        *
        * @param req, res
        * @return response
        */
        likesListSchoolStory: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schoolstory/likesList_access');
           var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var where = " WHERE 1=1 ";
           var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
           var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.story_id != 'undefined'){
                   where += " AND story_id=? ";
                   data.push(query_str.story_id.trim());
               }
               if(typeof query_str.school_id != 'undefined'){
                  where += " AND school_id=? ";
                  data.push(query_str.school_id.trim());
               }

               QUERY = "SELECT member_no, sum(status) as status FROM "+config_constant.SCHOOLSTORYLIKE+" "+where+" group by member_no ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting1 : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                   }
                   member_no = [];
                   _.each(rows, function(item){
                    if(item.status == '1'){
                      member_no +=','+"'"+item.member_no+"'"; 
                    }
                   });
                    if(member_no != ''){
                       member_no = member_no.substring('1');
                   }
                   if(_.size(member_no) > 0 ){
                   QUERY = "SELECT name, image FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") and status > '-1' order by member_no ";
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
                        output.like_list = rows;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/likesList_access');
                        res.json(output);
                      }
                   });
                 }else{
                  res.json({'status':message.failure, 'comments':message.nodata});
                 }
               });
        },
        /**
        * Post School Story.
        *
        * @param req, res
        * @return response
        */
        commentSchoolStory: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstory/comment_access');
             var data = [], output={};
             var SET = "";
             var input = JSON.parse(JSON.stringify(req.body));
           
             if(typeof input.story_id != 'undefined'){
                   SET +=" story_id=?, ";
                   data.push(input.story_id.trim());
              }
              if(typeof input.comment != 'undefined'){
                SET +=" comment=?,";
                data.push(input.comment.trim());
              }
              if(typeof input.school_id != 'undefined'){
                SET +=" school_id=?, ";
                data.push(input.school_id.trim());
              }
              if(typeof input.member_no != 'undefined'){
                SET +=" member_no=?, ";
                data.push(input.member_no.trim());
              }

               SET = SET.trim().substring(0, SET.trim().length-1);
               QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
               req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
                 if(err){
                   if(config.debug){
                        req.app.get('global').fclog("Error selecting1 : %s ",err);
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
               QUERY = "INSERT INTO "+config_constant.SCHOOLSTORYCOMMENT+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Inserting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                   }else{
                    QUERY = "SELECT comment, member_no FROM "+config_constant.SCHOOLSTORYCOMMENT+" WHERE story_id ='"+input.story_id+"' order by id DESC limit 1 ";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting2 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                       }else{
                        QUERY = "SELECT name FROM "+config_constant.EDUSER+" WHERE member_no = '"+input.member_no+"' and status > '-1'";
                        req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                            if(err){
                              if(config.debug){
                                  req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                            }else{
                              QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+input.school_id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                               if(config.debug){
                                req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                            class_id = [];
                              _.each(rows, function(item){
                                 class_id +=','+"'"+item.class_id+"'"; 
                              });
                              if(class_id != ''){
                                class_id = class_id.substring(1);
                              }
                             QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                 if(config.debug){
                                    req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                              }
                           }else{
                            parent_ac_no = [];
                              _.each(rows, function(item){
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                              });
                              if(parent_ac_no != ''){
                                parent_ac_no = parent_ac_no.substring(1);
                              }
                              //select Member_no form input school_id and select device id through Member_no.
                               QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+input.school_id+"' ";
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting6 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                 }                
                                 member_no = [];        
                                _.each(rows, function(item){
                                  if(item.member_no != 0){
                                  member_no += ','+"'"+item.member_no+"'";
                                 }
                                });                                
                                 if(member_no != ''){
                                   member_no = member_no.substring(1);
                                 }
                              if(_.size(device_id) > 0){
                                 if(_.size(member_no) > 0){                                 
                                 QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 }else{
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 } 
                               
                                 req.app.get('connection').query(QUERY, function(err, rows, fields){
                                  if(err){
                                     if(config.debug){
                                            req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                   } 
                                    QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no = '"+input.member_no+"'";
                                    req.app.get('connection').query(QUERY, function(err, rows4, fields){
                                        if(err){
                                           if(config.debug){
                                                  req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                                  res.json({error_code:1, error_msg:message.technical_error});
                                                  return false;
                                                }
                                         }
                                      
                                                                  
                               if (typeof input.message == 'undefined' || input.message == "") {
                                           input.message = "Comment in school story";
                                     }else{
                                      input.message = _global.cutString(input.message, 30)+'..';
                                    }
                                  _.each(rows, function(item){
                                    if (config.env === 'production'){
                                      _global.pushNotification({module_id:1, message:input.message, name:rows4[0]['name'], title:'Classgenie-Post', device_id:item.device_id});
                                      }
                                     });
                                     });
                                   }); 
							  }								   
                                 });
							   
                                  output.status = message.success;
                                  output.comments = message.success;
                                  output.comment_list = rows1[0];
                                  output.comment_list.comment = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/comment_access');
                                  res.json(output);
                                }
                              });
                              }
                            });
                           }
                          });
                         }
                      });
                     }
                 });
                }
                });
              },
        /**
        * All comment details School Story.
        *
        * @param req, res
        * @return response
        */
        allCommentDetail: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstory/allcommentDetail_access');
             var data = [], output={};
             var SET = "";
             //var input = JSON.parse(JSON.stringify(req.body));
             var query_str = url.parse(req.url,true).query;
             var where = " WHERE 1=1 ";
             if(typeof query_str.story_id != 'undefined'){
                   SET +=" story_id=?, ";
                   data.push(query_str.story_id.trim());
              }
              if(typeof query_str.teacher_ac_no != 'undefined'){
                   SET +=" teacher_ac_no=?, ";
                   data.push(query_str.teacher_ac_no.trim());
              }
            
              // select story Detail by story ID
              QUERY = "SELECT *, SUBSTR(image,LOCATE('.',image)+1) as ext FROM "+config_constant.SCHOOLSTORY+" WHERE id='"+query_str.story_id+"' ";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                 }
                 output.post = rows;
                 var teacher_name= "";
                 QUERY = "SELECT name FROM "+config_constant.EDUSER+" WHERE member_no = '"+rows[0]['teacher_ac_no']+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                        if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                        output.teacher_name= rows;
                        // select comment by story id
                        QUERY = "SELECT comment, school_id, member_no FROM "+config_constant.SCHOOLSTORYCOMMENT+" WHERE story_id = '"+query_str.story_id+"' ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                              if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                            }
                            var comment_list = {}, member_no=[];
                            output.comment_list=[];
                            _.each(rows, function(item){
                              output.comment_list.push(item);
                              member_no += ','+"'"+item.member_no+"'";
                            });
                            if(member_no != ''){
                              member_no = member_no.substring(1);
                            }
                            // select comment by story id
                            var item_node = {};
                            QUERY = "SELECT name, member_no, image FROM "+config_constant.EDUSER+" where member_no IN ("+member_no+") and status > '-1'";
                            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                _.each(rows, function(item, index){
                                  item_node[item.member_no] = item;
                                });
                                _.each(output.comment_list, function(item, index){
                                if(typeof item_node[item.member_no] != 'undefined'){
                                  output.comment_list[index]['name'] = item_node[item.member_no];
                                }
                            });
                            output.status = message.success;
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/allcommentDetail_access');
                            res.json(output);
                        });
                       });
                    });
              });
        },
        /**
        * Post School stories.
        *
        * @param req, res
        * @return response
        */
        postMsgSchoolStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstory/savemsgpost_access');
           var data = [], output={};
           var rows = [], rows1=[], rows2=[]; 
           var SET  = "";
           var teacher_name="";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.school_id != 'undefined'){
                 SET += " school_id=?, ";
                 data.push(input.school_id.trim());
            }
            if(typeof input.message != 'undefined'){
                 SET += " message=?, ";
                 data.push(input.message.trim());
            }
            if(typeof input.teacher_ac_no != 'undefined'){
                  SET += " teacher_ac_no=?, ";
                  data.push(input.teacher_ac_no.trim());
                  }
               SET = SET.trim().substring(0, SET.trim().length-1);
               QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
               req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
               if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error selecting1 : %s ",err);
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
                  QUERY = "INSERT INTO "+config_constant.SCHOOLSTORY+"  SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error in Inserting: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                    }
                  }else{
                      QUERY = " SELECT id, message FROM "+config_constant.SCHOOLSTORY+" where id ='"+rows.insertId+"' ";
                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error in Selecting2: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                    }else{
                      QUERY = " SELECT school_name FROM "+config_constant.SCHOOLS+" where school_id ='"+input.school_id+"'";
                      req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                      if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error in Selecting3: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                     }
                     QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no ='"+input.teacher_ac_no+"' and status > '-1'";
                      req.app.get('connection').query(QUERY, data, function(err, rows2, fields){
                      if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error in Selecting4: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                       }else{
                          QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+input.school_id+"'";
                            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                               if(config.debug){
                                req.app.get('global').fclog("Error Selecting5 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                            class_id = [];
                              _.each(rows, function(item){
                                 class_id +=','+"'"+item.class_id+"'"; 
                              });
                              if(class_id != ''){
                                class_id = class_id.substring(1);
                              }
                             QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                 if(config.debug){
                                    req.app.get('global').fclog("Error Selecting6 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                              }
                           }else{
                            parent_ac_no = [];
                              _.each(rows, function(item){
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                              });
                              if(parent_ac_no != ''){
                                parent_ac_no = parent_ac_no.substring(1);
                              }
                               QUERY = "SELECT student_ac_no FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                }
                             }else{
                              student_ac_no = [];
                              _.each(rows, function(item){
                                 student_ac_no += ','+"'"+item.student_ac_no+"'"; 
                              });
                              if(student_ac_no != ''){
                                student_ac_no = student_ac_no.substring(1);
                              }

                             //select Member_no form input school_id and select device id through Member_no.
                               QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+input.school_id+"' ";
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                   if(config.debug){
                                      req.app.get('global').fclog("Error Selecting8 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                 }                
                                 member_no = [];              
                                _.each(rows, function(item){
                                  if(item.member_no != 0){
                                  member_no += ','+"'"+item.member_no+"'";                      
                                  }
                                });                                
                               if(member_no != ''){
                                 member_no = member_no.substring(1);
                               }
                                if(_.size(device_id) > 0){
                            if(_.size(member_no) > 0){                                 
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 }else{
                                    QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 }  
                           req.app.get('connection').query(QUERY, function(err, rows, fields){
                            if(err){
                               if(config.debug){
                                      req.app.get('global').fclog("Error Selecting9 : %s ",err);
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
                                  _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id, member_no:member_no});
                                  }
                                 });
                               });
                              }
                             });
                             output.status = message.success;
                             output.comments = message.success;
                             output.list = rows1[0];                 
                             output.list.teacher_name = rows2;
                             output.list.posts = rows;
                             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/savemsgpost_access');
                             res.json(output);
                             }                   
                           });
                           }
                        });
                      }
                    });
                   }
                 });
                    });
                 }
                  });
                }
              });
              }
              });              
          },

       /**
       * All the request of school stories with post Method 
       *
       * @param req, res
       * @return response
       */
       updateMsgSchoolStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.message != 'undefined'){
                 SET += " message=?, ";
                 data.push(input.message.trim());
            }                      
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
            req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
               if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error selecting1 : %s ",err);
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
              QUERY = "UPDATE "+config_constant.SCHOOLSTORY+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.id+"'";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                  if(err){
                      if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{
                            QUERY = " SELECT * FROM "+config_constant.SCHOOLSTORY+" WHERE id='"+input.id+"'";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                               }else{
                                 
                                  QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" where school_id ='"+rows[0].school_id+"'";
                                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                  if(err){
                                     if(config.debug){
                                      req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                 }else{
                                  class_id = [];
                                    _.each(rows, function(item){
                                       class_id +=','+"'"+item.class_id+"'"; 
                                    });
                                    if(class_id != ''){
                                      class_id = class_id.substring(1);
                                    }
                                   QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id IN ("+class_id+")";
                                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                     if(err){
                                       if(config.debug){
                                          req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                    }
                                 }else{
                                  parent_ac_no = [];
                                    _.each(rows, function(item){
                                      parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                                    });
                                    if(parent_ac_no != ''){
                                      parent_ac_no = parent_ac_no.substring(1);
                                    }
                                     QUERY = "SELECT student_ac_no FROM "+config_constant.EDPARENTUSER+" where parent_ac_no IN ("+parent_ac_no+")";
                                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                       if(err){
                                         if(config.debug){
                                            req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                      }
                                   }else{
                                    student_ac_no = [];
                                    _.each(rows, function(item){
                                       student_ac_no += ','+"'"+item.student_ac_no+"'"; 
                                    });
                                    if(student_ac_no != ''){
                                      student_ac_no = student_ac_no.substring(1);
                                    }
                                    // //select Member_no form input school_id and select device id through Member_no.
                                   QUERY = "SELECT member_no FROM "+config_constant.NOTIFICATION+" where school_id ='"+rows[0].school_id+"'";
                                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                   if(err){
                                      if(config.debug){
                                         req.app.get('global').fclog("Error Selecting7 : %s ",err);
                                         res.json({error_code:1, error_msg:message.technical_error});
                                         return false;
                                        }
                                       }
                                       member_no = [];
                                       _.each(rows, function(item){
                                         if(item.member_no != 0){
                                         member_no += ','+"'"+item.member_no+"'";
                                        }
                                       });                                      
                                      if(member_no != ''){
                                        member_no = member_no.substring(1);
                                      }
                                       if(_.size(member_no) > 0){                                 
                                   QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) OR (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                                 }else{
                                   QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
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
                                             input.message = "Edite the post from Classgenie";
                                       }else{
                                        input.message = _global.cutString(input.message, 30)+'..';
                                      }
                                      _.each(rows, function(item){
                                      if (config.env === 'production'){
                                           _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id,  member_no:member_no});
                                        }
                                      });
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
                         });
                          }
                       });
                    }
            });
      }
    });
},
         /**
       * All the request of school stories with delete Method 
       *
       * @param req, res
       * @return response
       */
      deleteSchoolStories: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstories/delete_access');
           var output={}, data = [];
           //var query_str = url.parse(req.url,true).query;
           var input = JSON.parse(JSON.stringify(req.body));
           QUERY = "DELETE FROM "+config_constant.SCHOOLSTORY+" WHERE id =?";
           req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                    }
                     QUERY = "DELETE FROM "+config_constant.SCHOOLSTORYLIKE+" WHERE story_id = ?";
                     req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                     if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Deleting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                     }
                 });
                  QUERY = "DELETE FROM "+config_constant.SCHOOLSTORYCOMMENT+" WHERE id = ?";
                  req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                  if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                    }
                 });
                 QUERY = "SELECT count(teacher_ac_no) as count FROM "+config_constant.SCHOOLSTORY+" WHERE teacher_ac_no= '"+input.teacher_ac_no+"'ORDER BY id ASC ";
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
                      output.count = rows;
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'schoolstories/delete_access');
                      res.json(output);
                    }
                 });
           });
      },
        /**
        * All post details School Story.
        *
        * @param req, res
        * @return response
        */
        allPostSchoolStory: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstory/allpostschoolstory_access');
             var data = [], output={}, teacher_ac_no='', teacher_info={}, story_detail = {};
             var SET = "";
             var where = " WHERE 1=1 ";
             var input = JSON.parse(JSON.stringify(req.body));
             var page_size = req.app.get('config').page_size;
             var start_record_index = (input.page_number-1)*page_size;
               
             var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index>-1 && page_size != '') ? " LIMIT "+start_record_index+" ,"+page_size:" LIMIT 0,"+req.app.get('config').page_size;
             if(typeof input.school_id != 'undefined'){
             where += " AND school_id=? ";
             data.push(input.school_id.trim());
           } 
          
          // Select school id   
          QUERY = " SELECT *,date_format(created_at, '%b, %d %Y %h:%i %p') as 'date', SUBSTR(image,LOCATE('.',image)+1) as ext,  CONCAT(image,'$',rand()) as image_new FROM "+config_constant.SCHOOLSTORY+where+" ORDER BY id desc "+limit+"";
         
          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
                if(_.size(rows) > 0){
                  output.post = [];
                  story_id = [];
                  _.each(rows, function(item){
                    // select story_id from schoolstory
                    output.post.push(item);
                    story_id += ','+item.id;     
                    teacher_ac_no += ','+item.teacher_ac_no;        
                 });
                 if(story_id != ''){
                   story_id = story_id.substring('1');
                }
                if(teacher_ac_no != ''){
                      teacher_ac_no = teacher_ac_no.substring(1);
               }
               QUERY = "SELECT member_no, name FROM "+config_constant.EDUSER+" WHERE member_no in ("+teacher_ac_no+") ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting2 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                      }
                 }
                 _.each(rows, function(item){
                          teacher_info[item.member_no] = item.name;
                    });
               });
              // select school name
               QUERY = "SELECT school_name FROM "+config_constant.SCHOOLS+" where school_id ='"+input.school_id+"'";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting3 : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                        output.school_name=(rows);
                      });                      
                     // select comment by story id
                        QUERY = " SELECT * FROM "+config_constant.SCHOOLSTORYCOMMENT+" where story_id IN ("+story_id+") order by story_id";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                            res.json({'status':message.failure, 'comments':"No Post Available"});
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting4: %s ",err);
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
                      QUERY = "SELECT sum(status) as status,member_no,story_id FROM "+config_constant.SCHOOLSTORYLIKE+" where story_id IN ("+story_id+") group by story_id,member_no";
                      req.app.get('connection').query(QUERY, function(err, rows1, fields){
                       if(err){
                         if(config.debug){
                              req.app.get('global').fclog("Error Selecting5 : %s ",err);
                              res.json({error_code:1, error_msg:"No Post Available"});
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
                         _.each(output.post, function(item, index){
                                   output.post[index]['comment_detail'] = story_detail[item.id];
                                   output.post[index]['comment_count'] = _.size(story_detail[item.id]);
                                   output.post[index]['like_status'] = story_status[item.id];
                                   output.post[index]['teacher_name'] = teacher_info[item.teacher_ac_no];
                             });
                             output.status = message.success;
                             output.comments = message.success;
                             res.json(output);
                          });
                        });
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/allpostschoolstory_access');
                      }else{
                        output.status = message.failure;
                        output.comments = message.nodata;
                        res.json(output);
                      }
                    });
                 },
                  /**
                  *  Display All Comment with name for single post.
                  *
                  * @param req, res
                  * @return response
                  */
                 
                 allcommentShoolStories:function(req, res){
                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'schoolstory/allcommentDetail_access');
                     var data = [], output={}, member_name=[], name = [];
                     var SET = "";
                     var input = JSON.parse(JSON.stringify(req.body));
                     if(typeof input.story_id != 'undefined'){
                           SET += " story_id=? ";
                        }
                         if(typeof input.teacher_ac_no != 'undefined'){
                           SET += " teacher_ac_no=? ";
                        }
                       // select story Detail by story ID
                        QUERY = " SELECT * FROM "+config_constant.SCHOOLSTORY+" where id=?";
                        req.app.get('connection').query(QUERY, input.story_id, function(err, rows, fields){
                        if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }                       
                        output.post = rows;
                        var teacher_name= "";
                        QUERY = " SELECT name FROM "+config_constant.EDUSER+" where member_no=? and status > '-1'";
                        req.app.get('connection').query(QUERY, input.teacher_ac_no, function(err, rows, fields){
                        if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                        output.teacher_name= rows;
                        // select comment by story id
                        QUERY = " SELECT comment, school_id, member_no FROM "+config_constant.SCHOOLSTORYCOMMENT+" where "+SET+"";
                        req.app.get('connection').query(QUERY, input.story_id, function(err, rows, fields){
                        if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                        var comment_list = {}, member_no=[];
                        output.comment_list=[];
                        _.each(rows, function(item){
                           output.comment_list.push(item);
                           member_no += ','+item.member_no;
                         });
                         if(member_no != ''){
                           member_no = member_no.substring(1);
                         }
                        // select comment by story id
                        var item_node = {};
                        QUERY = " SELECT name, member_no FROM "+config_constant.EDUSER+" where member_no IN ("+member_no+") and status > '-1'";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                               _.each(rows, function(item, index){
                                 item_node[item.member_no] = item.name;                     
                               });
                               _.each(output.comment_list, function(item, index){
                                if(typeof item_node[item.member_no] != 'undefined'){
                                  output.comment_list[index]['name'] = item_node[item.member_no];
                                }
                               });
                                output.status = message.success;
                                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schoolstory/allcommentDetail_access');
                                res.json(output);
                        });   
                      });
                    });
                  });
             }
    }