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
       * Post message in school story 
       *
       * @param req, res
       * @return response
       */
       studentStoryMsgpost: function(req, res){
       	   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/msgpost_access');
           var data = [], output={};
           var rows = [], rows1=[], rows2=[]; 
           var SET  = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.message != 'undefined'){
           	SET += " message=?, ";
           	data.push(input.message.trim());
           }
           if(typeof input.class_id != 'undefined'){
           	SET +=" class_id=?, ";
           	data.push(input.class_id.trim());
           }
           if(typeof input.student_no != 'undefined'){
           	SET +=" student_no=?, ";
           	data.push(input.student_no.trim());
           }
           if(typeof input.username != 'undefined'){
            SET +=" username=?, ";
            data.push(input.username.trim());
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
                QUERY = "INSERT INTO "+config_constant.STUDENTSTORY+"  SET "+SET+", teacher_ac_no = '"+input.member_no+"', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 	if(err){
                 		if(config.debug){
                 			req.app.get('global').fclog("Error in Inserting: %s",err);
                 			res.json({error_code:1, error_msg:message.technical_error});
    	                    return false;
                 		}
              	}else{
             		  QUERY ="SELECT * FROM "+config_constant.STUDENTSTORY+" WHERE id = '"+rows.insertId+"' ";
             		  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             		  	if(err){
             			  	if(config.debug){
               				 	req.app.get('global').fclog("Error in Selecting : %s",err);
               					res.json({error_code:1, error_msg:message.technical_error});
  	                    return false;
             				}
             			}
                  QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" where class_id ='"+input.class_id+"' ";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }
                      teacher_ac_no = [];
                      _.each(rows, function(item){
                        if(item.teacher_ac_no != 0){
                          teacher_ac_no += ','+item.teacher_ac_no;
                        }
                      });
                      if(teacher_ac_no != ''){
                        teacher_ac_no = teacher_ac_no.substring(1);
                      }
                      // check length parent_ac_no in Notification tabel
                      if(teacher_ac_no.length > 0){
                          if(_.size(device_id) > 0){
                              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (`member_no` IN ("+teacher_ac_no+")) AND (`device_id` NOT IN("+device_id+")) AND status = 1";
                              req.app.get('connection').query(QUERY, function(err, rows, fields){
                                if(err){
                                  if(config.debug){
                                    req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                                }
                                if(typeof input.message == 'undefined' || input.message == ""){
                                  input.message = "New Post from Classgenie";
                                }
                                _.each(rows, function(item){
                                  if (config.env === 'production'){
                                    _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id, member_no:teacher_ac_no});
                                   }
                                  });
                                 });
                                  }                            
                            }
                    });
             	       output.status = message.success;
                     output.comments = message.success;
                     output.list = rows;                 
                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/msgpost_access');
                     res.json(output);
             			
             		});
             	}
             });
           }
           });//end device id
       },
       
       /**
       * update message in school story 
       *
       * @param req, res
       * @return response
       */
       updateStudentStoryMsg: function(req, res){
       	   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/updatemsgpost_access');
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
                QUERY = "UPDATE "+config_constant.STUDENTSTORY+" SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id = '"+input.id+"' ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                	if(err){
                		if(config.debug){
                			req.app.get('global').fclog("Error in Updating: %s",err);
                			res.json({error_code:1, error_msg:message.technical_error});
    	                    return false;
                		}
                	}else{
                		QUERY = "SELECT * FROM "+config_constant.STUDENTSTORY+" WHERE id = '"+input.id+"' ";
                		req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                			if(err){
                				if(config.debug){
                					req.app.get('global').fclog("Error in Selecting: %s",err);
                					res.json({error_code:1, error_msg:message.technical_error});
    	                            return false;
                				}
                			}
                      QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" where class_id ='"+rows[0]['class_id']+"' ";
                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                          if(err){
                            if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                          }
                          teacher_ac_no = [];
                          _.each(rows, function(item){
                            if(item.teacher_ac_no != 0){
                              teacher_ac_no += ','+item.teacher_ac_no;
                            }
                          });
                          if(teacher_ac_no != ''){
                            teacher_ac_no = teacher_ac_no.substring(1);
                          }                          
                          // check length parent_ac_no in Notification tabel
                          if(teacher_ac_no.length > 0){
                            if(_.size(device_id) > 0){
                            QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (`member_no` IN ("+teacher_ac_no+")) AND (`device_id` NOT IN("+device_id+")) AND status = 1";
                            req.app.get('connection').query(QUERY, function(err, rows, fields){
                              if(err){
                                if(config.debug){
                                  req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                              }
                              if(typeof input.message == 'undefined' || input.message == ""){
                                input.message = "Updating Post from Classgenie";
                              }
                              _.each(rows, function(item){
                                if (config.env === 'production'){
                                  _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id});
                                }
                               });
                            });
                          }else{
                            output.status = message.failure;                                   
                            res.json(output);
                          }
                        }
                      });
              			   output.status = message.success;
                       output.comments = message.success;
                       output.list = rows;                 
                       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/updatemsgpost_access');
                       res.json(output);
              		
            		});
            	}
            });
          }
        });
       },

       /**
       * save photos/videos in school story 
       *
       * @param req, res
       * @return response
       */
       studentStoryPost: function(req, res){
         //mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/post_access');
       	 var input = JSON.parse(JSON.stringify(req.body));
         var output={};
         var data = ''; var teacher_ac_no=0; var student_no=0;var img1 = '';
         if (!req.file){
             if(config.debug){
                  req.app.get('global').fclog("No file was uploaded.");
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
                  fs.writeFile(config.upload_path+'/student_stories/'+file.originalname, data, function(err){
                    if (err) {
                    res.json({err:'Input File Error'});
                    return false;
                 }

                  var img = '';

          if(input.class_id!=''){
                   class_id = input.class_id;
                   }
          if(input.username!=''){
                   username = input.username;
                   }
          if(input.student_no!=0){
                  student_no = input.student_no;
                  }
          if(input.member_no!=0){
                  member_no = input.member_no;
                  }
          if(typeof input.message != 'undefined'){
                    var  message= input.message;                           
            }else{
                    var  message= "";
                  }
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
                  QUERY =  "INSERT INTO "+config_constant.STUDENTSTORY+" SET image="+"'"+img+"'" +",message= "+"'"+message+"'"+",class_id= "+"'"+input.class_id+"'"+",username= "+"'"+input.username+"'"+",teacher_ac_no= "+"'"+input.member_no+"'"+",student_no= "+"'"+student_no+"'"+", created_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'";
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
                      fs.rename(config.upload_path+'/student_stories/'+file.originalname, config.upload_path+'/student_stories/'+img1, function(err){
                        if(err){
                          req.app.get('global').fclog("Error In rename : %s ",err);return false;
                        }
                      });
                      QUERY = "UPDATE "+config_constant.STUDENTSTORY+" SET image="+"'"+img1+"'" +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
                      req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                        if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                        }
                       // check length parent_ac_no in Notification tabel
                        QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" where class_id ='"+input.class_id+"' ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                              if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                            }
                            teacher_ac_no = [];
                            _.each(rows, function(item){
                              if(item.teacher_ac_no != 0){
                                teacher_ac_no += ','+item.teacher_ac_no;
                              }
                            });
                            if(teacher_ac_no != ''){
                              teacher_ac_no = teacher_ac_no.substring(1);
                            }
                            // check length parent_ac_no in Notification tabel
                            if(teacher_ac_no.length > 0){                            
                             if(_.size(device_id) > 0){
                              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (`member_no` IN ("+teacher_ac_no+")) AND (`device_id` NOT IN("+device_id+")) AND status = 1";
                              req.app.get('connection').query(QUERY, function(err, rows, fields){
                                if(err){
                                  if(config.debug){
                                    req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                                }
                                if(typeof input.message == 'undefined' || input.message == ""){
                                  input.message = "New Post from Classgenie";
                                }
                                _.each(rows, function(item){
                                  if (config.env === 'production'){
                                    _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id, member_no:teacher_ac_no});
                                   }
                                  });
                                 });
                                 }else{
                                   output.status = message.failure;                                   
                                   res.json(output);
                                 }                            
                            }
                          });                         
                      });
                       output.status = message.success;
                       output.comments = message.success;
                       res.json(output);
                      });
                   
                    if (fs.existsSync(config.upload_path+'/student_stories/'+img1)){
                    fs.unlinkSync(file.path);
                  }
                }
              });//end device id
            });
          }else{
            res.json({err:'Invalid file format!'});
            return false;
          }
        },       

       /**
       * update photos/videos in school story 
       *
       * @param req, res
       * @return response
       */
       updatePostStudentStory: function(req, res){
       	  //mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/post_update_access');
				  var input = JSON.parse(JSON.stringify(req.body));
				  var output={};var data = '';var student_no=0;var img1 = '';
				  if (!req.file){
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
				    fs.writeFile(config.upload_path+'/student_stories/'+file.originalname, data, function(err){
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
				    fs.rename(config.upload_path+'/student_stories/'+file.originalname, config.upload_path+'/student_stories/'+img, function(err){
				      if (err){
				        if(config.debug){
				          req.app.get('global').fclog("Error in rename",err);
				          res.json({error_code:1, error_msg:message.technical_error});
				          return false;
				        }
				      }
				    });
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

				    QUERY = "UPDATE "+config_constant.STUDENTSTORY+" SET image="+"'"+img+"'" +", message="+"'"+input.message+"'" +",updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
				    req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
				      if(err){
				      if(config.debug){
				        req.app.get('global').fclog("Error Updating : %s ",err);
				        res.json({error_code:1, error_msg:message.technical_error});
				        return false;
				      }
				    }
				    //select Parent_ac_no form input class_id and select device id through parent_ac_no.
				    QUERY = "SELECT class_id FROM "+config_constant.STUDENTSTORY+" where id ='"+input.id+"'";
				    req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
				      if(err){
				        if(config.debug){
				          req.app.get('global').fclog("Error Selecting : %s ",err);
				          res.json({error_code:1, error_msg:message.technical_error});
				          return false;
				        }
				      }
             
				      QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" where class_id ='"+rows1[0].class_id+"'";
				      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
				        if(err){
				          if(config.debug){
				            req.app.get('global').fclog("Error Selecting : %s ",err);
				            res.json({error_code:1, error_msg:message.technical_error});
				            return false;
				          }
				        }
				        teacher_ac_no = [];
				        _.each(rows, function(item){
				          if(item.teacher_ac_no != 0){
				            teacher_ac_no += ','+item.teacher_ac_no;
				          }
				        });
				        if(teacher_ac_no != ''){
				          teacher_ac_no = teacher_ac_no.substring(1);
				        }
				        // check length parent_ac_no in Notification tabel
				        if(teacher_ac_no.length > 0){
                  if(_.size(device_id) > 0){
				            QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+teacher_ac_no+") AND (`device_id` NOT IN("+device_id+")) AND status = 1";
				            req.app.get('connection').query(QUERY, function(err, rows, fields){
				            if(err){
				              if(config.debug){
				                req.app.get('global').fclog("Error Selecting2 : %s ",err);
				                res.json({error_code:1, error_msg:message.technical_error});
				                return false;
				              }
				            }
				            if(typeof input.message == 'undefined' || input.message == ""){
				              input.message = "Updating Post from Classgenie";
				            }
				            _.each(rows, function(item){
				              if (config.env === 'production'){
				                _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id,  member_no:teacher_ac_no});
				              }
				             });
				          });
				        }
              }
				      });
				    });
				    output.status = message.success;
				    output.comments = message.success;
				    res.json(output);
            });
          }//end device id
				  });
				    if (fs.existsSync(config.upload_path+'/student_stories/'+img)){
				      fs.unlinkSync(file.path);
				    }
          });
				  }else{
				    res.json({err:'Invalid file format!'});
				    return false;
				  }
				},

			   /**
		       * List of story in school story 
		       *
		       * @param req, res
		       * @return response
		       */
				studentStoryList: function(req, res){
				       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/postlist_access');
		           var data = [], output={};
		           var SET = "";
		           var input = JSON.parse(JSON.stringify(req.body));
		           var page_size = req.app.get('config').page_size;
                   var start_record_index = (input.page_number-1)*page_size;
                   var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index>-1 && page_size != '') ? " LIMIT "+start_record_index+" ,"+page_size:" LIMIT 0,"+req.app.get('config').page_size;
		           if(typeof input.student_no != 'undefined'){
		                 SET += " student_no=?, ";
		                 data.push(input.student_no.trim());
		            }
                if(typeof input.class_id != 'undefined'){
                  SET += " class_id=?, ";
                  data.push(input.class_id.trim());
                }
		            SET = SET.trim().substring(0, SET.trim().length-1);
                if(input.class_id != ''){
                       QUERY = "SELECT *,date_format(created_at, '%b, %d %Y %h:%i %p') as 'date', SUBSTR(image,LOCATE('.',image)+1) as ext, CONCAT(image,'$',rand()) as image_new FROM "+config_constant.STUDENTSTORY+" WHERE student_no = '"+input.student_no+"' AND class_id = '"+input.class_id+"' AND status='0' ORDER BY id DESC "+limit+" ";  
                    }else{
                       QUERY = "SELECT *,date_format(created_at, '%b, %d %Y %h:%i %p') as 'date', SUBSTR(image,LOCATE('.',image)+1) as ext, CONCAT(image,'$',rand()) as image_new FROM "+config_constant.STUDENTSTORY+" WHERE student_no = '"+input.student_no+"' OR class_id = '"+input.class_id+"' AND status='0' ORDER BY id DESC "+limit+" ";
                    }                    
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                       	if(config.debug){
                       		req.app.get('global').fclog("Error in Selecting : %s",err);
                       		res.json({error_code:1, error_msg:message.technical_error});
	                        return false;
                       	}
                       }else{
                        
                        var user_list = {}, class_id = [], member_no = [];
                             output.user_list = [];
                          _.each(rows, function(item){
                            output.user_list.push(item);
                            class_id += ','+"'"+item.class_id+"'";
                            member_no +=','+"'"+item.teacher_ac_no+"'";
                          });
                          if(class_id != ''){
                            class_id = class_id.substring(1);
                          }
                          if(member_no != ''){
                            member_no = member_no.substring(1);
                          }

                          var image_node = {};
                          QUERY = "SELECT image, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") ";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                _.each(rows, function(item, index){
                                  image_node[item.member_no] = item.image;
                                });
                          var item_node = {};
                          QUERY = "SELECT class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                _.each(rows, function(item, index){
                                  item_node[item.class_id] = item.class_name;
                                });
                                _.each(output.user_list, function(item, index){                      
                                    output.user_list[index]['class_name'] = item_node[item.class_id];
                                    output.user_list[index]['image_name'] = image_node[item.teacher_ac_no];
                                  
                                });
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/postlist_access');
                                res.json(output);
                              });
                          });                                         	
                       }
                    });
				},

			   /**
		       * Story approve by teacher in school story 
		       *
		       * @param req, res
		       * @return response
		       */
				storyApproveTeacher: function(req, res){
				       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/approveteacher_access');
		           var data = [], output={};
		           var SET = "";
		           var input = JSON.parse(JSON.stringify(req.body));               
               //Function call for unaproved story
               if(input.status == '-1'){
                  module.exports.unApproveStory(req, res, input);      
               }else{  
		           if(typeof input.id != 'undefined'){
		                 SET += " id=?, ";
		                 data.push(input.id.trim());
		            }
                if(typeof input.status != 'undefined'){
                  SET += " status=?, ";
                  data.push(input.status.trim());
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
      		            QUERY = "UPDATE "+config_constant.STUDENTSTORY+" SET status = '"+input.status+"' WHERE id = '"+input.id+"' ";
      		            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                              	if(config.debug){
                              		req.app.get('global').fclog("Error in Updating: %s",err);
                              		res.json({error_code:1, error_msg:message.technical_error});
      	                            return false;
                              	}
                              }else{
                              	QUERY = "SELECT * FROM "+config_constant.STUDENTSTORY+" WHERE status = '1' AND id = '"+input.id+"' ";
                              	req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                      if(err){
                                      	if(config.debug){
                                      		req.app.get('global').fclog("Error in Selecting : %s",err);
                                      		res.json({error_code:1, error_msg:message.technical_error});
      	                                    return false;
                                      	}
                                      }else{
                                      	QUERY = "INSERT INTO "+config_constant.CLASSSTORIES+" SET image = '"+rows[0]['image']+"', message = '"+rows[0]['message']+"', class_id = '"+rows[0]['class_id']+"', username = '"+rows[0]['username']+"', teacher_ac_no = '"+rows[0]['teacher_ac_no']+"', student_no = '"+rows[0]['student_no']+"', created_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"' ";
                                      	req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                              if(err){
                                              	if(config.debug){
                                              		req.app.get('global').fclog("Error in Inserting : %s",err);
                                              		res.json({error_code:1, error_msg:message.technical_error});
      	                                            return false;
                                              	}
                                              }else{
                                              	QUERY = "SELECT * FROM "+config_constant.CLASSSTORIES+" WHERE id = '"+rows.insertId+"' ";
                                              	req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                                      if(err){
                                                      	if(config.debug){
                                                      		req.aap.get('global').fclog("Error in Selecting : %s",err);
                                                      		res.json({error_code:1, error_msg:message.technical_error});
      	                                                    return false;
                                                      	}
                                                      }                                       
                                                      if(_.size(rows1) > 0){ 
                                                        if(_.size(device_id) > 0){                                                 
                                                          QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no = '"+rows1[0]['teacher_ac_no']+"' AND (`device_id` NOT IN("+device_id+")) AND status = 1";
                                                          req.app.get('connection').query(QUERY, function(err, rows, fields){
                                                            if(err){
                                                              if(config.debug){
                                                                req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                                                res.json({error_code:1, error_msg:message.technical_error});
                                                                return false;
                                                              }
                                                            }
                                                            if(typeof input.message == 'undefined' || input.message == ""){
                                                              input.message = "Approved Post from Classgenie";
                                                            }
                                                            _.each(rows, function(item){
                                                              if (config.env === 'production'){
                                                                _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id});
                                                              }
                                                             });
                                                          });
                                                        }
                                                      }
                                                      	output.timestamp = req.query.timestamp;
                      									                output.status = message.success;
                      									                output.comments = message.success;
                      									                output.story_list = rows1;
                      									                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'studentstory/approveteacher_access');
                      									                res.json(output);                                                
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
		        },

           /**
           * Unapprove pending story by the teacher
           *
           * @param req, res
           * @return response
           */
            unApproveStory: function(req, res, input){
              var output = {};
              // select device_id by input sender_ac_no                 
                QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
                req.app.get('connection').query(QUERY, function(err, rows_device_id, fields){
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
                      QUERY = "UPDATE "+config_constant.STUDENTSTORY+" SET status = '"+input.status+"' WHERE id = '"+input.id+"' ";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                        if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error in Updating: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                          }
                        }else{
                          QUERY = "SELECT teacher_ac_no FROM "+config_constant.STUDENTSTORY+" WHERE id = '"+input.id+"' ";
                          req.app.get('connection').query(QUERY, function(err, rows, fields){
                             if(err){
                              if(config.debug){
                                req.app.get('global').fclog("Error in Selecting: %s",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                             }
                             if(_.size(rows) > 0){
                             if(_.size(device_id) > 0){                                                  
                                QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no = '"+rows[0]['teacher_ac_no']+"' AND (`device_id` NOT IN("+device_id+")) AND status = 1";
                                req.app.get('connection').query(QUERY, function(err, rows, fields){
                                  if(err){
                                    if(config.debug){
                                      req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                  }
                                  if(typeof input.message == 'undefined' || input.message == ""){
                                    input.message = "Unapproved Post from Classgenie";
                                  }
                                  _.each(rows, function(item){
                                    if (config.env === 'production'){
                                      _global.pushNotification({module_id:5, message:_global.cutString(input.message, 20)+'..', title:'Classgenie-Post', device_id:item.device_id});
                                    }
                                   });
                                });
                              }
                            }
                              output.timestamp = req.query.timestamp;
                              output.status = message.success;
                              output.comments = message.success;
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'studentstory/approveteacher_access');
                              res.json(output);
                          });
                         }
                      });
                    }
                  });
              },

		       /**
		       * Delete student post in school story 
		       *
		       * @param req, res
		       * @return response
		       */
		        deleteStudentPost: function(req, res){
		           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/approveteacher_access');
		           var data = [], output={};
		           var SET = "";
		           var input = JSON.parse(JSON.stringify(req.body));
		           if(typeof input.id != 'undefined'){
		                 SET += " id=?, ";
		                 data.push(input.id.trim());
		            }
		           SET = SET.trim().substring(0, SET.trim().length-1);
		           QUERY = "DELETE FROM "+config_constant.STUDENTSTORY+" WHERE id = '"+input.id+"' ";
		           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                       	if(config.debug){
                       		req.app.get('global').fclog("Error in Deleting : %s",err);
                       		res.json({error_code:1, error_msg:message.technical_error});
	                        return false;
                       	}
                       }else{
                       	  output.timestamp = req.query.timestamp;
    		                  output.status = message.success;
    		                  output.comments = message.success;
    		                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'studentstory/postdelete_access');
    		                  res.json(output);
                       }
		           });
		        },

            /**
           * Delete student post in school story 
           *
           * @param req, res
           * @return response
           */
            commentDetail: function(req, res){
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'classstories/commentDetail_access');
               var data = [], output={}, member_name=[], name = [];
               var SET = "";
               var input = JSON.parse(JSON.stringify(req.body));
               if(typeof input.story_id != 'undefined'){
                     SET += " story_id=? ";
                  }
                 // select story Detail by story ID
                  QUERY = "SELECT *, SUBSTR(image,LOCATE('.',image)+1) as ext FROM "+config_constant.STUDENTSTORY+" where id=?";
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
                  QUERY = "SELECT name, image FROM "+config_constant.EDUSER+" where member_no='"+input.teacher_ac_no+"' and status > '-1'";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                  if(err){
                     if(config.debug)
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                   }
                   output.teacher_name= rows;
                   // select comment by story id
                   QUERY ="SELECT id, story_id, comment, class_id, member_no FROM "+config_constant.CLASSCOMMENT+" where "+SET+"";
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
                          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classstories/commentDetail_access');
                          res.json(output);
                  });  
                });
              });
            });
           },

           /**
           * Story details for class id 
           *
           * @param req, res
           * @return response
           */
           classPostList: function(req, res){
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentstory/postlist_access');
               var query_str = url.parse(req.url,true).query;
               var data = [], output={};
               var where = " WHERE 1=1 ";
               var page_size = req.app.get('config').page_size;
               var start_record_index = (query_str.page_number-1)*page_size;
               var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index>-1 && page_size != '') ? " LIMIT "+start_record_index+" ,"+page_size:" LIMIT 0,"+req.app.get('config').page_size;
               if(typeof query_str.class_id != 'undefined'){
                  where += " class_id=?, ";
                  data.push(query_str.class_id.trim());
                }               
                  QUERY = "SELECT *, SUBSTR(image,LOCATE('.',image)+1) as ext, CONCAT(image,'$',rand()) as image_new FROM "+config_constant.STUDENTSTORY+" WHERE (class_id = '"+query_str.class_id+"' AND status='0') ORDER BY id DESC "+limit+" ";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                      if(config.debug){
                        req.app.get('global').fclog("Error in Selecting : %s",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                     }else{
                      var user_list = {}, class_id = [], member_no = [];
                           output.user_list = [];
                        _.each(rows, function(item){
                          output.user_list.push(item);
                          class_id += ','+"'"+item.class_id+"'";
                          member_no += ','+"'"+item.teacher_ac_no+"'";
                        });
                        if(class_id != ''){
                          class_id = class_id.substring(1);
                        }
                        if(member_no != ''){
                          member_no = member_no.substring(1);
                        }
                        
                        var image_node = {};
                        QUERY = "SELECT image, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              _.each(rows, function(item, index){
                                image_node[item.member_no] = item.image;
                              });
                           
                        var item_node = {};
                        QUERY = "SELECT class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              _.each(rows, function(item, index){
                                item_node[item.class_id] = item.class_name;
                              });

                              _.each(output.user_list, function(item, index){
                                  output.user_list[index]['class_name'] = item_node[item.class_id];
                                  output.user_list[index]['image_name'] =  image_node[item.teacher_ac_no];                             
                              });

                              output.timestamp = req.query.timestamp;
                              output.status = message.success;
                              output.comments = message.success;
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/postlist_access');
                              res.json(output);
                        });
                        });                                           
                     }
                  });

         },

           /**
           * School list
           *
           * @param req, res
           * @return response
           */
           schoolList: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'user_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              //getting the school list based on the student ac no
              if(query_str['member_no'][0] == '4'){
                   module.exports.student_schoolList(req, res, query_str);
               } else {
              if(typeof query_str.member_no != 'undefined'){
                   where += " AND member_no=? ";
                   data.push(query_str.member_no.trim());
               }
               QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+query_str.member_no+"' ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error in Selecting : %s",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                       }else if(_.size(rows) < 0){
                         res.json({'status':message.failure, 'comments':message.noresult});
                       }else{
                        class_id = [];
                        _.each(rows, function(item){
                           class_id += ','+"'"+item.class_id+"'";
                        });
                        if(class_id != ''){
                          class_id = class_id.substring(1);
                        }
                         QUERY = "SELECT DISTINCT school_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                             if(err){
                                  if(config.debug){
                                    req.app.get('global').fclog("Error in Selecting : %s",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                                 }else{
                                   school_id = [];
                                  _.each(rows, function(item){
                                     school_id += ','+"'"+item.school_id+"'";
                                  });
                                  if(school_id != ''){
                                    school_id = school_id.substring(1);
                                  }
                                 QUERY = "SELECT school_id, school_name FROM "+config_constant.SCHOOLS+" WHERE school_id IN ("+school_id+") ";
                                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                     if(err){
                                          if(config.debug){
                                            req.app.get('global').fclog("Error in Selecting : %s",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                         }else{
                                            output.timestamp = req.query.timestamp;
                                            output.status = message.success;
                                            output.comments = message.success;
                                            output.school_name = rows;
                                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/postlist_access');
                                            res.json(output);
                                         }
                                       });
                                 }
                             });
                      }
               });
           }
         },

           /**
           * Getting the school list based on the student ac no
           *
           * @param req, res
           * @return response
           */
          student_schoolList: function(req, res, query_str){
           var output = {};
            QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no = '"+query_str.member_no+"' ";
                req.app.get('connection').query(QUERY, function(err, rows, fields){
                   if(err) {
                     if(config.debug) {
                          req.app.get('global').fclog("Error in Selecting1 : %s",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                     }
                    }else{
                      info_id = [];
                      _.each(rows, function(item){
                           info_id += ','+"'"+item.student_info_id+"'";
                    });
                    if(info_id != ''){
                        info_id = info_id.substring(1);
                    }
                    if(_.size(info_id) > 0){
                    QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+info_id+")";
                    req.app.get('connection').query(QUERY, function(err, rows, fields){
                     if(err){
                      if(config.debug){
                      req.app.get('global').fclog("Error in Selecting2 : %s",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                       }
                     }else{
                     class_id = [];
                     _.each(rows, function(item){
                      class_id += ','+"'"+item.class_id+"'";
                        });
                        if(class_id != ''){
                          class_id = class_id.substring(1);
                        }
                        if(_.size(class_id) > 0){
                      QUERY = "SELECT DISTINCT school_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                           req.app.get('global').fclog("Error in Selecting3 : %s",err);
                           res.json({error_code:1, error_msg:message.technical_error});
                           return false;
                         }
                       }else{
                       school_id = [];
                      _.each(rows, function(item){
                       school_id += ','+"'"+item.school_id+"'";
                       });
                      if(school_id != ''){
                       school_id = school_id.substring(1);
                        }
                        QUERY = "SELECT school_id, school_name FROM "+config_constant.SCHOOLS+" WHERE school_id IN ("+school_id+") ";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error in Selecting4 : %s",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                            }
                       } else {
                           output.timestamp = req.query.timestamp;
                           output.status = message.success;
                           output.comments = message.success;
                           output.school_name = rows;
                           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentstory/postlist_access');
                           res.json(output);
                        }
                       });
                      }
                     });
                     }else{
                      res.json({'status':message.failure, 'comments':message.nodata});
                    }
                    }
                  });
                }else{
                  res.json({'status':message.failure, 'comments':message.nodata});
                }
                }
              });
            }                
       }
