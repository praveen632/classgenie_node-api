var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var sendmail = require('../common/sendmail');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var wp_user = require('./wp_user');
var school = require('./schools');
var fs = require('fs');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      listTeacher: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'teacher_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.id != 'undefined'){
                   where += " AND id=? ";
                   data.push(query_str.id.trim());
               }
               if(typeof query_str.name != 'undefined'){
                   where += " AND name=? ";
                   data.push(query_str.name.trim());
                }
                if(typeof query_str.email != 'undefined'){
                   where += " AND email=? ";
                   data.push(query_str.email.trim());
                }
                if(typeof query_str.phone != 'undefined'){
                   where += " AND phone=? ";
                   data.push(query_str.phone.trim());
                }
                if(typeof query_str.user_id_not_in != 'undefined'){
                   where += " AND id<>? ";
                   data.push(query_str.user_id_not_in.trim());
                }                
               QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+" AND type='2' ORDER BY id "+sort_by+" "+limit+" ";
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
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'teacher_access');
               res.json(output);
          });
      },

      /**
       * All the request of user with GET method and execute in search operation.
       *
       * @param req, res
       * @return response
       */
      searchTeacher: function (req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'teacher/search_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.member_no != 'undefined'){
                 where += " AND member_no = ? ";
                 data.push(query_str.member_no.trim());
             }
             if(typeof query_str.name != 'undefined'){
                 where += " AND name like ? ";
                 data.push(query_str.name.trim()+"%");
              }
             if(typeof query_str.email != 'undefined'){
                 where += " AND email = ?";
                 data.push(query_str.email.trim());
              }
			  
             QUERY = " SELECT * FROM "+config_constant.EDUSER+" "+where+"  ORDER BY id DESC ";
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
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'teacher/search_access');
               res.json(output);
          });
      },

      /**
       *Add teacher
       *
       * @param req, res
       * @return response
       */       
       addTeacher:function(req,res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher_access');
           var data = [], output={};var data_school=[];
           var SET = ""; var SET_schooldata ="";
           var input = JSON.parse(JSON.stringify(req.body));    
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.email != 'undefined'){
                 SET += " email=?, ";
                 data.push(input.email.trim());
             }
             if(typeof input.phone != 'undefined'){
                 SET += " phone=?, ";
                 data.push(input.phone.trim());
            }
            if(typeof input.password != 'undefined'){
                 SET += "password=?, ";
                 data.push(md5(input.password.trim()));
               }

            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "SELECT email FROM "+config_constant.EDUSER+" WHERE  email=? and status > '-1'";
            req.app.get('connection').query(QUERY, [input.email], function(err, rows, fields){
               if(_.size(rows)>0){
                    res.json({'status':message.failure, 'comments':message.email_aready_exist});
                    return false;
                  }else{
                   SELECT = "SELECT member_no FROM "+config_constant.TEACHERSEED+" where user_id ='' ORDER BY id ASC limit 1";
                   req.app.get('connection').query(SELECT, function(err, rows_seed, fields){
                    
                           result = rows_seed[0];
                       if(req.body.flag == "portal"){
                        var status = '1'; 
                       }else{
                        var status = '0';
                       }   

                       QUERY = "INSERT INTO "+config_constant.EDUSER+" SET "+SET+", member_no="+result['member_no']+", type='"+input.usertype+"', school_id='"+input.school+"', status = '"+status+"', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                        req.app.get('connection').query(QUERY, data, function(err, rows_insert1, fields){
                        if(err){
                          if(config.debug){
                               req.app.get('global').fclog("Error in Inseting: %s",err);
                               res.json({error_code:1, error_msg:message.technical_error});
                               return false;
                          }
                         }else{ 
                            SELECT = "SELECT * FROM "+config_constant.EDUSER+" where id ='"+rows_insert1.insertId+"' and status > '-1'";
                            req.app.get('connection').query(SELECT, data, function(err, rows_select, fields){
                              if(err){
                                if(config.debug){
                                   req.app.get('global').fclog("Error in Selecting: %s",err);
                                   res.json({error_code:1, error_msg:message.technical_error});
                                   return false;
                                }
                              }else{
                                result = rows_select[0];
                                QUERY = "UPDATE "+config_constant.TEACHERSEED+"  SET user_id ='"+result['id']+"', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+result['member_no']+"'";
                                req.app.get('connection').query(QUERY, data, function(err, rows_update, fields){
                                   if(err){
                                    if(config.debug){
                                       req.app.get('global').fclog("Error in Updating: %s",err);
                                       res.json({error_code:1, error_msg:message.technical_error});
                                       return false;
                                    }
                                   }else{
                                     if(req.body.flag == "portal"){
                                       QUERY = "INSERT INTO "+config_constant.SCHOOLTEACHER_REQ+"  SET teacher_ac_no ='"+result['member_no']+"', school_id='"+input.school+"'";
                                       req.app.get('connection').query(QUERY, function(err, rows_update, fields){
                                           if(err){
                                            if(config.debug){
                                               req.app.get('global').fclog("Error in Updating1: %s",err);
                                               res.json({error_code:1, error_msg:message.technical_error});
                                               return false;
                                          }
                                         }
                                        });
                                     }
                                     sendmail.send({id:14, 'to':input.email,'member_no':result['member_no'],'PROD_MAIL_USER':config_constant.PROD_MAIL_USER});
                                     output.timestamp = req.query.timestamp;
                                     output.status = message.success;
                                     output.comments = message.success;
                                     output.user_list = rows_select;
                                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'teacher_access');
                               // Function call for word press 
                                     res.json(output);
                                 }
                                 }); 
                               }
                             });
                          }               
                        });                  
                    });
                  }
                });
          },

       /**
       * All the request of Teacher with put Method 
       *
       * @param req, res
       * @return response
       */
      updateTeacher:function (req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.password != 'undefined'){
                 SET += " password=?, ";
                 data.push(md5(input.password.trim()));
             }           
            if(typeof input.phone != 'undefined'){
                 SET += " phone=?, ";
                 data.push(input.phone.trim());
             }
			 if(typeof input.age != 'undefined'){
                 SET += " age=?, ";
                 data.push(input.age.trim());
             }
             if(typeof input.email != 'undefined'){
                 SET += " email=?, ";
                 data.push(input.email.trim());
             }
             if(typeof input.member_no != 'undefined'){
             var img_name = 'img_'+input.member_no;    
             }
             if(typeof input.image != 'undefined'){    
                   var img = input.image;           
                   var dataImage = img.replace(/^data:image\/\w+;base64,/, '');
                   fs.writeFile(config.upload_path+'/profile_image/'+img_name+'.jpg', dataImage, {encoding: 'base64'}, function(err){  
               });
                   SET += " image=?, ";
                   data.push(img_name+'.jpg');
             }     
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE  member_no=? and status > '-1' ";
             req.app.get('connection').query(QUERY, input.member_no, function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }else{                  
                   QUERY = "UPDATE "+config_constant.EDUSER+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                       }else{
                         QUERY = " SELECT * FROM "+config_constant.EDUSER+" WHERE member_no=? and status > '-1' ";
                         req.app.get('connection').query(QUERY,input.member_no, function(err, rows, fields){
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
                              //function for word press 
                             // wp_user.wp_update(req, res, input.member_no, input.name, input.password, input.email);
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'teacher/update_access');
                              res.json(output);
                              
                          }
                       });
                    }
                });
           }          
       });
   },
    /**
       * Delete teacher
       *
       * @param req, res
       * @return response
       */
     deleteTeacher: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/delete');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.member_no != 'undefined'){
                 SET += " member_no=?, ";
                 data.push(input.member_no.trim());
            }
           SET = SET.trim().substring(0, SET.trim().length-1);
           QUERY = "UPDATE "+config_constant.EDUSER+" SET status = '-1', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
           req.app.get('connection').query(QUERY, function(err, rows, fields){
               if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Updating : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
               }else{
                 QUERY = "DELETE FROM "+config_constant.NOTIFICATION+" WHERE member_no = '"+input.member_no+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                      if(config.debug){
                         req.app.get('global').fclog("Error Deleting1 : %s ",err);
                         res.json({error_code:1, error_msg:message.technical_error});
                         return false;
                      }
                     }else{
                      QUERY = "DELETE FROM "+config_constant.SCHOOLTEACHER_REQ+" WHERE teacher_ac_no = '"+input.member_no+"' ";
                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                            if(config.debug){
                               req.app.get('global').fclog("Error Deleting2 : %s ",err);
                               res.json({error_code:1, error_msg:message.technical_error});
                               return false;
                            }
                     }else{
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'teacher/delete');
                        res.json(output);
                      }
                      //function for delete from word press
                      //wp_user.wp_delete(req, res, input.member_no);
                    });
               }
             });
            }
          });
         },
		 
		 
	 portal_change_status: function (req, res) {
		   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/status');
           var data = [], output={};
           var SET = "";
		   var input = JSON.parse(JSON.stringify(req.body));
         if(typeof input.member_no != 'undefined'){
                 SET += " member_no=?, ";
                 data.push(input.member_no.trim());
            }
           SET = SET.trim().substring(0, SET.trim().length-1);
		
        if (input.flag == 2) {
            QUERY = "UPDATE  "+config_constant.EDUSER+ " SET status= '0' WHERE member_no='" + input.member_no + "'";
            } else {
            QUERY = "UPDATE  " +config_constant.EDUSER+ " SET status= '1' WHERE member_no='" + input.member_no + "'";
           }
          req.app.get('connection').query(QUERY, function (err, rows, result) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }else{
            if(req.body.flag == 2){    
            QUERY = "UPDATE  " +config_constant.SCHOOLTEACHER_REQ+ " SET status= '0' WHERE teacher_ac_no='" + input.member_no + "'";    
             }else{
             QUERY = "UPDATE  " +config_constant.SCHOOLTEACHER_REQ+ " SET status= '1' WHERE teacher_ac_no='" + input.member_no + "'";    
             }
             req.app.get('connection').query(QUERY, function (err, rows, result) {
            
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
              }
           });
          
        }
             output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'teacher/status');
                        res.json(output);

        });
    },
	
	
	getPortalDataById: function (req, res) {
		mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'databyid');
		var input = JSON.parse(JSON.stringify(req.query));
		
       var data = [], output={};
        QUERY = "SELECT * FROM " +config_constant.EDUSER+" WHERE member_no='"+input.member_no+"'";
        req.app.get('connection').query(QUERY,function (err, rows, fields) {
            if (err) {
                req.app.get('global').fclog("Error Selecting : %s ", err);
                res.end();
            }
			
              output.timestamp = req.query.timestamp;
              output.status = message.success;
             output.user_list = rows;
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'databyid');
              res.json(output);

        });

    },
	
	 updateportalTeacherById: function (req, res) {
		  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/updateportalTeacherById');
		   var data = [], output={};
           var SET = "";
		   var input = JSON.parse(JSON.stringify(req.body));


        if (input.member_no != 'undefined') {
            var member_no = input.member_no;
        }

        if (input.type != 'undefined') {
            var type = input.type;
        }
		if (input.school_id != 'undefined') {
            var school_id = input.school_id;
        }
        
       
        if(type == 1 || type == 5){  
        QUERY = "select count(type) as total from " +config_constant.EDUSER+ " WHERE  school_id='"+input.school_id+"' AND type='+type+'";           
        req.app.get('connection').query(QUERY, function (err, rows, fields) {
            
            if (err) {
                req.app.get('global').fclog("Error Selecting : %s ", err);
                res.end();
            }

            if (rows[0]['total'] > 0 ) { 
			output.timestamp = req.query.timestamp;
                output.status = message.success;
                 output.userStatus = 'exist';  
                  res.json(output);             
            }else{
				
             QUERY = "update "+config_constant.EDUSER+" set type='" + type + "' WHERE member_no='"+input.member_no+"'";
			 req.app.get('connection').query(QUERY,  function (err, rows, fields) {
                    if (err) {
                        req.app.get('global').fclog("Error Selecting : %s ", err);
                        res.end();
                    }
                    output.status = message.success;
                    output.userStatus = 'notexist';
                     res.json(output);
                });
            }
         });
            } else {
                QUERY = "update " +config_constant.EDUSER+ " set type='" + type + "' WHERE member_no=?";
                req.app.get('connection').query(QUERY, [member_no], function (err, rows, fields) {
                    if (err) {
                        req.app.get('global').fclog("Error Selecting : %s ", err);
                        res.end();
                    }
                   output.status = message.success;
                    output.userStatus = 'notexist';
					 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/updateportalTeacherById');
                    res.json(output);
                });
            }
            
    },
	
	remove_teacher_portal: function (req, res){
		mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/remove_teacher_portal');
     var data = [], output={};
           var SET = "";
		   var input = JSON.parse(JSON.stringify(req.body));
    QUERY = "UPDATE  " +config_constant.EDUSER+ " SET status= '-1' WHERE member_no='"+input.member_no+"'"; 
                                req.app.get('connection').query(QUERY, function(err, rows, result){
                                    if(err){
                                        if(config.debug){
                                              req.app.get('global').fclog("Error Selecting : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                            }
                                        }
                                       output.status = message.success;
										mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'teacher/remove_teacher_portal');
                                        res.json(output);

                                    });
      }

	
	
	
	
			 
    }

