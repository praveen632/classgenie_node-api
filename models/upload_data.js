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
 upload: function (req, res){ 
         var input = JSON.parse(JSON.stringify(req.body));
		     var output={};var data = '';var parent_ac_no=0;var student_no=0;var img1 = '';
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
                  fs.writeFile(config.upload_path+'/class_stories/'+file.originalname, data, function(err){
                     if (err) {
                        res.json({err:'Input File Error'});
                        return false;
                     }
                  var img = '';
				  if(input.parent_ac_no!=''){
						   parent_ac_no = input.parent_ac_no;
						   }
				  if(input.student_no!=0){
						  student_no = input.student_no;
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
                  QUERY =  "INSERT INTO "+config_constant.CLASSSTORIES+" SET image="+"'"+img+"'" +",message= "+"'"+message+"'"+",class_id= "+"'"+input.class_id+"'"+",teacher_ac_no= "+"'"+input.teacher_ac_no+"'"+", teacher_name= "+"'"+input.teacher_name+"'"+", parent_ac_no= "+"'"+parent_ac_no+"'"+",student_no= "+"'"+student_no+"'"+", created_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'";
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
                      fs.rename(config.upload_path+'/class_stories/'+file.originalname, config.upload_path+'/class_stories/'+img1, function(err){
                        if(err){
                          req.app.get('global').fclog("Error In rename : %s ",err);return false;
                        }
                      });
                      QUERY = "UPDATE "+config_constant.CLASSSTORIES+" SET image="+"'"+img1+"'" +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
                      req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                        if(err){
                          if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
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
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
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
                                student_ac_no += ','+"'"+item.student_ac_no+"'";
                                }
                              });

                             if(student_ac_no != ''){
                               student_ac_no = student_ac_no.substring(1);
                             }  

                          if(_.size(student_ac_no) > '0'){
                          QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
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
                                _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:input.class_id, member_no:item.member_no});
                                }
                               });
                             });                   
                          });
                        }
                         });
                        output.status = message.success;
                        output.comments = message.success;
                        res.json(output);
                      });
                      });
                    });
                    if (fs.existsSync(config.upload_path+'/class_stories/'+img1)){
                    fs.unlinkSync(file.path);
                  }
				  }
		         });			  
				  //end
                });
                }else{
                  res.json({err:'Invalid file format!'});
                  return false;
                }
              },

/**
* Update class story 
*
* @param req, res
* @return response
*/
upload_update: function (req, res){
          var input = JSON.parse(JSON.stringify(req.body));
          var output={};var data = '';var parent_ac_no=0;var student_no=0;var img1 = '';
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
            fs.writeFile(config.upload_path+'/class_stories/'+file.originalname, data, function(err){
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
            fs.rename(config.upload_path+'/class_stories/'+file.originalname, config.upload_path+'/class_stories/'+img, function(err){
              if (err){
                if(config.debug){
                  req.app.get('global').fclog("Error in rename",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
              }
            });
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
                              QUERY = "UPDATE "+config_constant.CLASSSTORIES+" SET image="+"'"+img+"'" +", message="+"'"+message+"'" +",updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                if(err){
                                if(config.debug){
                                  req.app.get('global').fclog("Error Updating : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                              }
                              //select Parent_ac_no form input class_id and select device id through parent_ac_no.
                              QUERY = "SELECT class_id FROM "+config_constant.CLASSSTORIES+" where id ='"+input.id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                              if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                               }
                              QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" where class_id ='"+rows1[0].class_id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                               }
                                parent_ac_no = [];
                                  _.each(rows, function(item){
                                    if(item.parent_ac_no != 0){
                                    parent_ac_no += ','+"'"+item.parent_ac_no+"'";
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
                                      req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                       return false;
                                     }
                                   }
                                   student_ac_no = [];
                                    _.each(rows_stu_no, function(item){
                                      if(item.student_ac_no != 0){
                                      student_ac_no += ','+"'"+item.student_ac_no+"'";
                                      }
                                    });
                                   if(student_ac_no != ''){
                                     student_ac_no = student_ac_no.substring(1);
                                   }
                                  if(_.size(student_ac_no) > '0'){
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+"))  and device_id NOT IN ("+device_id+") and status = 1";
                                  }else{
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+parent_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";  
                                  }
                                 
                                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                                      if(err){
                                         if(config.debug){
                                                req.app.get('global').fclog("Error Selecting5 : %s ",err);
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
                                            _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, class_id:rows1[0].class_id, member_no:item.member_no});
                                          }
                                        });
                                     });
                                });
                           }
                         });
                      });
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output);
                    });
                      if (fs.existsSync(config.upload_path+'/class_stories/'+img)){
                        fs.unlinkSync(file.path);
                      }
                  	}
                  }); //end
                });
                }
                else{
                  res.json({err:'Invalid file format!'});
                  return false;
                }
              }
            }					   