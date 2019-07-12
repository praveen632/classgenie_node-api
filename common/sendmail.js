var config = require('./config');
var sprintf = require('sprintf').sprintf;
var _ = require('underscore');
var config_constant = require('./config_constant');
var connection = require('./connection');
var _global = require('./global');
var _mail = require('./mail');
var encryption = require('../common/encryption');
var Base64 = require('js-base64').Base64;
var redis = require("redis");
var md5 = require("js-md5");
var serialize = require("node-serialize");

/**
 * Common send email class
 */
 var nodemailer = require('nodemailer');
 var smtpTransport = require('nodemailer-smtp-transport');
 var mail = {};
 module.exports = {
 	     send: function (obj){
             var data = [];var parent_no;var email;var studentno;
    	 	  	 var where = " WHERE 1=1 ";
             if(_.size(obj)<1){
    	         	obj = {};
    	         }
               client = redis.createClient(config.cache_port, config.cache_server);
               client.auth(config.cache_password);
               if(config.cache){
                    Key = 'EMAIL_'+md5("SELECT * FROM "+config_constant.EMAIL+" WHERE `id`='"+obj.id+"'");
                    client.get(Key, function(err, data) {
                         if(err || data === null) {
                             QUERY = "SELECT * FROM "+config_constant.EMAIL+" WHERE `id`='"+obj.id+"'";
                             connection.query(QUERY, data, function(err, rows, fields){
                               if(err){
                                    _global.fclog("Error Selecting : %s ",err);
                                    return;
                                }
                                client.set(Key, serialize.serialize(rows));      
                                module.exports.sendmail(obj, rows);
                             });
                         }
                         else
                         {
                             rowdata = serialize.unserialize(data);
                             module.exports.sendmail(obj, rowdata);
                         }
                    });
               }
               else
               {
                     QUERY = "SELECT * FROM "+config_constant.EMAIL+" WHERE `id`='"+obj.id+"'";
      	             connection.query(QUERY, data, function(err, rows, fields){
                     if(err){
                          _global.fclog("Error Selecting : %s ",err);
                          return;
                      }
                      module.exports.sendmail(obj, rows);
      	             });
               }
 	      },
       sendmail: function(obj, rows){
              mail.to = obj.to;
              mail.subject = rows[0].subject;
              mail.body = rows[0].body;
              mail.feature = rows[0].feature;
              switch(rows[0].id){
                //For send mail of class list to Teacher
                 case 1:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.name);
                     break;
                    //send mail for contact us
                 case 2:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.PROD_MAIL_USER);
                    break;
                    //send mail for parent invite from Teacher
                 case 3:
                     mail.subject = sprintf(mail.subject,obj.teacher_name);
                     var token_parent = encryption.encrypt(obj.to +'~'+obj.parent_no);
                     var url =config.web_url+'/message?'+'token_parent='+token_parent;
                     mail.body = sprintf(mail.body,obj.teacher_name,obj.parent_no,url);
                    break;
                 case 4:
				    var token = encryption.encrypt(obj.to +'~'+obj.student_no);
                    var url =config.web_url+'/message?'+'token='+token;
                     mail.subject = sprintf(mail.subject);
                     mail.body = sprintf(mail.body,obj.student_name,obj.student_name,obj.student_no,obj.parent_no,url);
                     break;
                     //send mail for approved Teacher account by existing Teacher in school
                 case 5:
                     var member_no= encryption.encrypt(obj.member_no);
                     
                     var url =config.web_url+'/message?'+'member_no='+member_no;

                     mail.subject = sprintf(mail.subject);
                     mail.body = sprintf(mail.body,obj.name,url);
                     break;
                      //Send mail to approve school
                 case 6:
                     mail.subject = sprintf(mail.subject);
                     mail.body = sprintf(mail.body,obj.teacher_name,obj.school_name);
                    break;
                
               //Send mail to teacher when anyone approved their account and also for admin.
                 case 7:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.name);
                      break;

                      //Send mail to teacher when anyone approved their account
                 case 8:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.PROD_MAIL_USER);
                      break;

                 //Send mail to refer teacher 
                 case 9:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body);
                      break;

                      //Send mail for forget password 
                 case 10:
                      var token = encryption.encrypt(obj.to);
                      var url =config.web_url+'/forgotpasswordupdate?'+'token='+token;
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,url);
                      break;
                       //Send mail for refer teacher
                 case 11:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body);
                      var url =config.web_url+'/message?'+'token='+token;
                      mail.body = sprintf(mail.body,url);
                      break;
                     // Send mail for forgot password 
                 case 12:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body);
                      mail.body = sprintf(mail.body,url);
                      break;
                      // Send mail for subscribe us 
                case 13:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body);
                      break;
					   // Send mail on sighup for teacher
                case 14:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.member_no,obj.PROD_MAIL_USER);
                      break;
                // Send mail on sighup for parent
                case 15:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.name,obj.member_no,obj.PROD_MAIL_USER);
                      break;
                  //For send  attendance mail to Teacher
                 case 16:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.name);
                     break; 
                  //Send mail for student forgot password   
                 case 17:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body, obj.name, obj.password);
                     break; 
                 
                 //send mail for delete teacher from admin  
                 case 18:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.PROD_MAIL_USER);
                    break;

                    //send mail for disable school from admin  
                 case 19:
                 
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.PROD_MAIL_USER);
                    break;

                      //send mail for approved school and send mail to related teacher from admin  
                 case 20:                 
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body,obj.PROD_MAIL_USER);
                    break;
                                            
                 default:
                      mail.subject = sprintf(mail.subject);
                      mail.body = sprintf(mail.body);
                  
              }
              _mail.send(mail, obj);
       }
 }