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
var sendmail = require('../common/sendmail');
var Base64 = require('js-base64').Base64;
module.exports = {

 sendmail: function (req, res){
 
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'mail_access');
              var query_str = url.parse(req.url,true).query;console.log(query_str);
              var input = JSON.parse(JSON.stringify(req.body));console.log(input);
              var id = query_str.id;
              var email = query_str.email;
              var data = [], output={};
              var where = "WHERE 1=1";           
              if(input.emaildata != ''){                
                  var input1 = Base64.decode(input.emaildata);            
              }
             //For send mail of class list to Teacher
              if(id == 1){ 
                  if(typeof query_str.member_no != 'undefined'){
                       where += " AND member_no=? ";
                       data.push(query_str.member_no.trim());
                   }
                    if(typeof query_str.class_id != 'undefined'){
                       where += " AND class_id=? ";
                       data.push(query_str.class_id.trim());
                   }
                    QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE `member_no`='"+query_str.member_no+"' and status > '-1'";
                  	 req.app.get('connection').query(QUERY, function(err, rows, fields){
                     if(err){
                         if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                        }             
                        QUERY1 = "SELECT id FROM "+config_constant.CLASSINFO+" WHERE `class_id`='"+query_str.class_id+"'";
                        req.app.get('connection').query(QUERY1, function(err, rows1, fields){ 
                          if(err){
                             if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                          }						  
                         var pdfname= 'ClassGenie_parent_invites_for_class_'+rows1[0].id;          
                         sendmail.send({id:1, 'to':rows[0].email,'name':rows[0].name, attachment_name:pdfname+'.pdf', attachment:"assets/pdf/code/"+pdfname+".pdf"});
                         output.timestamp = req.query.timestamp;
                         output.status = message.success;
                         output.comments = message.success;
                         res.json(output);
                     });
                     });
              }
              //send mail for contact us
              else if(id==2)
              { 
                //console.log(input);
               
                  sendmail.send({id:id, 'to':email,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});  
                  output.timestamp = req.query.timestamp;
                  output.status = message.success;
                  output.comments = message.success;
                  res.json(output);                
              }
              //send mail to parent invite from Teacher
              else if(id==3){
              QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE email='"+query_str.email+"' and status > '-1' ";
              req.app.get('connection').query(QUERY, function(err, rows_memberno, fields){
                       if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }else{
                         if(_.size(rows_memberno)> 0){ 
						               if(rows_memberno[0].member_no[0]=='2'){
						                    var mail_data = "teacher";
                                output.mail_flage =mail_data;
                          }else{
						                 module.exports.sendmail_member_no(req, res, query_str.email,query_str.parent_no,query_str.teacher_name)
					            	  }
					           	}else{
						            module.exports.sendmail_member_no(req, res, query_str.email,query_str.parent_no,query_str.teacher_name)
						        }
                  }					   
                  output.timestamp = req.query.timestamp;
                  output.status = message.success;
                  output.invite = '-1';
                  output.comments = message.success;
                  res.json(output);
                });               
             }
               //send mail for approved child account
               else if(id==4){
                      QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE email='"+query_str.email+"' and status > '-1' ";
                      req.app.get('connection').query(QUERY, function(err, rows_memberno, fields){
                               if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                }else{
                         if(_.size(rows_memberno)> 0){ 
                            if(rows_memberno[0].member_no[0]=='2'){                          
                              var mail_data = "teacher";
                              output.mail_flage =mail_data;
                              }else{
                                sendmail.send({id:id, 'to':query_str.email,'student_name':query_str.student_name,'student_no':query_str.student_no,'parent_no':query_str.parent_no});  
                                }
                              }else{
                                sendmail.send({id:id, 'to':query_str.email,'student_name':query_str.student_name,'student_no':query_str.student_no,'parent_no':query_str.parent_no});  
                              }            
                      }
                 //sendmail.send({id:id, 'to':query_str.email,'student_name':query_str.student_name,'student_no':query_str.student_no,'parent_no':query_str.parent_no});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output); 
                  });
              }
               //send mail for approved Teacher account by existing Teacher in school
              else if(id==5){
                         
                      QUERY = "SELECT name FROM "+config_constant.EDUSER+" WHERE `member_no`='"+input.member_no+"' and status > '-1'";
                      req.app.get('connection').query(QUERY, function(err, name_rows, fields){
                       if(err){
                           if(config.debug){
                              req.app.get('global').fclog("Error Selecting11 : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                          }                         
                          var arr = input1.split(",");                                               
                          sendmail.send({id:id, 'to':arr,name:name_rows[0]['name'],member_no:input.member_no});
                          output.timestamp = req.query.timestamp;
                          output.status = message.success;
                          output.comments = message.success;
                          res.json(output); 
                  });
                }
                //Send mail to approve school
                else if(id==6){
                    sendmail.send({id:id, 'to':'customercare@classgenie.in','teacher_name':query_str.teacher_name,'school_name':query_str.school_name});   
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);
                }
                //Send mail to teacher when anyone approved their account and also for admin.
                 else if(id==7){
                  QUERY = "SELECT name FROM "+config_constant.EDUSER+" WHERE email = '"+query_str.email+"' ";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }
                    sendmail.send({id:id, 'to':email, 'name':rows[0].name});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output); 
                    }); 
                }
                 //Send mail to teacher when approved school from  admin pannel
                 else if(id==8){
                    sendmail.send({id:id, 'to':email,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);  
                }
                //Send mail to invite teacher
                 else if(id==9){
                    sendmail.send({id:id, 'to':email});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);  
                }
                // Send mail for forget password
                else if(id==10){
                  QUERY = "SELECT email FROM "+config_constant.EDUSER+" WHERE `email`='"+email+"'";
                  console.log(QUERY);
                  req.app.get('connection').query(QUERY, function(err, rows, fields){ 
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                    }	
                    if(_.size(rows) > '0'){
                      sendmail.send({id:id, 'to':email});  
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output); 
                    }else{
                      output.timestamp = req.query.timestamp;
                      output.status = message.failure;
                      output.comments = message.failure;
                      res.json(output);
                    }
                  });
                     
                }
                // Send mail for refer teacher
                else if(id==11){
                    sendmail.send({id:id, 'to':email});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);  
                }
                 // Send mail for forgot password 
                else if(id==12){
                    sendmail.send({id:id, 'to':email});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);  
                }
                 // Send mail for subscribe us 
                else if(id==13){
                    sendmail.send({id:id, 'to':email});  
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);  
                }
                //Send mail for student forgot password
                 else if(id==17){
                  
                  QUERY = "SELECT username FROM "+config_constant.EDUSER+" WHERE username = '"+query_str.username+"' ";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }else if(_.size(rows) > 0){
                          var student_no = _global.getCode('NP');
                          var password = md5(student_no.trim())
                          QUERY = "UPDATE "+config_constant.EDUSER+" SET password = '"+password+"' WHERE username = '"+query_str.username+"' ";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                             if(err){
                              if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                             }else{
                                QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE username = '"+query_str.username+"' ";
                                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                    if(err){
                                      if(config.debug){
                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                    }else{
                                       QUERY = "SELECT parent_ac_no FROM "+config_constant.EDPARENTUSER+" WHERE student_ac_no = "+rows[0]['member_no']+" ";
                                       req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                            if(err){
                                              if(config.debug){
                                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                                res.json({error_code:1, error_msg:message.technical_error});
                                                return false;
                                              }
                                            }else if(_.size(rows1) > 0){
                                                QUERY = "SELECT email, name FROM "+config_constant.EDUSER+" WHERE member_no = '"+rows1[0]['parent_ac_no']+"' ";
                                                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                                    if(err){
                                                      if(config.debug){
                                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                                        res.json({error_code:1, error_msg:message.technical_error});
                                                        return false;
                                                      }
                                                    }else{
                                                      
                                                      sendmail.send({id:id, 'to':rows[0].email, 'name':rows[0].name, 'password':student_no});  
                                                      output.timestamp = req.query.timestamp;
                                                      output.status = message.success;
                                                      output.comments = message.success;
                                                      res.json(output);
                                                    }
                                                  });                                              
                                            }else{
                                               res.json({'status':message.failure, 'comments':message.noresult});
                                            }
                                          });
                                    }
                                  });
                             }
                          });
                      }else{
                        res.json({'status':message.failure, 'comments':message.noresult});
                      }                  
                     });  
                }
              //send mail for delete teacher from admin
                else if(id==18)
                { 
                      sendmail.send({id:id, 'to':email,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});  
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output);                
                }
                //send mail for disable school from admin
                else if(id==19)
                { 
                  
                     var email = input.email.split(',');
                      for(var i=0;i<_.size(email);i++){
                        sendmail.send({id:id, 'to':email[i],'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});
                    }
                      //sendmail.send({id:id, 'to':email,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});  
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output);                
                }
                //send mail for approve school from admin and send mail to school related teacher
                else if(id==20)
                { 
                  
                     var email = input.email.split(',');
                      for(var i=0;i<_.size(email);i++){
                        sendmail.send({id:id, 'to':email[i],'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});
                    }
                      //sendmail.send({id:id, 'to':email,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});  
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output);                
                }               
                  else
                {
                      sendmail.send({id:id, 'to':email});  
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      res.json(output);                
                }
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'mail_access');
           },
		 
		     sendmail_member_no: function (req, res, email, parent_no, teacher_name){
		     sendmail.send({id:3, 'to':email,'parent_no':parent_no,'teacher_name':teacher_name}); 
                        var point = -1;
                        QUERY = "UPDATE "+config_constant.STUDENTINFO+"  SET request_status="+"'"+point+"'"+",updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"' WHERE parent_no='"+parent_no+"'";
                         req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                        });
		  },
   }