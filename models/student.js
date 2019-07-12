var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var encryption = require('../common/encryption');
var md5 = require("js-md5");
var Base64 = require('js-base64').Base64;
var connection = require('../common/connection');
var fs = require('fs');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      listStudent: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'student_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.id != 'undefined'){
                   where += " AND id=? ";
                   data.push(query_str.id.trim());
               }
               if(typeof query_str.username != 'undefined'){
                   where += " AND username=? ";
                   data.push(query_str.username.trim());
                }
                if(typeof query_str.age != 'undefined'){
                   where += " AND age=? ";
                   data.push(query_str.age.trim());
                }
                if(typeof query_str.user_id_not_in != 'undefined'){
                   where += " AND id<>? ";
                   data.push(query_str.user_id_not_in.trim());
                }
               QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+" and status > '-1' ORDER BY username asc "+sort_by+" "+limit+" ";
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
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'student_access');
               res.json(output);
          });
      },

      /**
       * All the request of user with GET method and execute in search operation.
       *
       * @param req, res
       * @return response
       */
      searchStudent: function (req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'student/search_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.username != 'undefined'){
                 where += " AND username like ? ";
                 data.push(query_str.username.trim()+"%");
             }
             if(typeof query_str.age != 'undefined'){
                 where += " AND age like ? ";
                 data.push(query_str.age.trim()+"%");
              }
             if(typeof query_str.member_no != 'undefined'){
                 where += " AND member_no like ? ";
                 data.push(query_str.member_no.trim()+"%");
              }
             QUERY = " SELECT * FROM "+config_constant.EDUSER+" "+where+" and status > '-1' ORDER BY id DESC ";
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
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'student/search_access');
               res.json(output);
          });
      }, 
      /**
       * All the request of student with POST method and execute in SAVE operation.
       *
       * @param req, res
       * @return response
       */
       insertStudent: function (req, res){       
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'student_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
		    if(typeof input.username != 'undefined'){
                 SET += " username=?, ";
                 data.push(input.username.trim());
             }
             if(typeof input.password != 'undefined'){
                 SET += " password=?, ";
                 data.push(md5(input.password.trim()));
             }             
             if(typeof input.age != 'undefined'){
                 SET += " age=?, ";
                 data.push(input.age.trim());
             }
            
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT username FROM "+config_constant.EDUSER+" WHERE  username=? and status > '-1'";
             req.app.get('connection').query(QUERY, [input.username], function(err, rows, fields){
                if(err){
                   if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }else if(_.size(rows)>0){
                  res.json({'status':message.failure, 'comments':message.name_already_exist});
                  return false;
                 }else{
                    if(typeof input.password == 'undefined'){
                         res.json({'status':message.success, 'comments':message.success});
                         res.end();
                    }else if(typeof input.password != 'undefined'){
                      SELECT = "SELECT member_no FROM "+config_constant.STUDENTSEED+" where user_id ='' ORDER BY id ASC limit 1";
                      req.app.get('connection').query(SELECT, function(err, rows1, fields){
                       if(err){
                           if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{                          
                           result = rows1[0];
                           QUERY = "INSERT INTO "+config_constant.EDUSER+" SET "+SET+", member_no="+result['member_no']+", type='4', status='0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '"; 
                           req.app.get('connection').query(QUERY, data, function(err, rows, result){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Inserting1 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                            }else{
                              SELECT = "SELECT * FROM "+config_constant.EDUSER+" where id ='"+rows.insertId+"' and status > '-1'";
                              req.app.get('connection').query(SELECT, data, function(err, rows, result){
                           if(err){
                               if(config.debug){
                                    req.app.get('global').fclog("Error Selecting : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                               }else{
                                result = rows[0];
                                QUERY = "UPDATE "+config_constant.STUDENTSEED+" SET user_id ='"+result['id']+"', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+result['member_no']+"'";
                                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                   if(err){
                                      if(config.debug){
                                          req.app.get('global').fclog("Error Updating : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                        }
                                   }
                                });
                                QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET status = '1', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE student_no='"+input.student_no+"'";
                                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                    if(config.debug){
                                        req.app.get('global').fclog("Error Updating : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                  }
                                });
                                result1 = rows1[0];
                                QUERY = "INSERT INTO "+config_constant.USERSTUDENTINFO+" SET student_info_id="+input.id+", student_ac_no="+result['member_no']+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '"; 
                                req.app.get('connection').query(QUERY, data, function(err, rows, result){
                                if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Inserting2 : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                }
                              });
                                QUERY = "SELECT parent_ac_no FROM "+config_constant.STUDENTINFO+" WHERE student_no = '"+input.student_no+"' ";
                                req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                   if(err){
                                      if(config.debug){
                                          req.app.get('global').fclog("Error Inserting3 : %s ",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false;
                                        }
                                    }else if(_.size(rows) > 0){
                                         QUERY = "SELECT parent_ac_no FROM "+config_constant.EDPARENTUSER+" WHERE student_ac_no = "+result['member_no']+" OR parent_ac_no = "+rows1[0]['parent_ac_no']+" ";
                                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                             if(err){
                                              if(config.debug){
                                                req.app.get('global').fclog("Error Inserting3 : %s ",err);
                                                res.json({error_code:1, error_msg:message.technical_error});
                                                return false;
                                              }
                                             }else if(_.size(rows) > 0){                            
                                               output.comments = message.success;  
                                             }else{                                           
                                                QUERY = "INSERT INTO "+config_constant.EDPARENTUSER+" SET parent_ac_no = "+rows1[0]['parent_ac_no']+", student_ac_no = "+result['member_no']+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
                                                req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                                                   if(err){
                                                      if(config.debug){
                                                          req.app.get('global').fclog("Error Inserting3 : %s ",err);
                                                          res.json({error_code:1, error_msg:message.technical_error});
                                                          return false;
                                                        }
                                                    }
                                                  });
                                              }
                                         });
                                    }
                                      output.timestamp = req.query.timestamp;
                                      output.status = message.success;
                                      output.comments = message.success;
                                      output.user_list = rows;
                                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student_access');
                                      res.json(output);
                                      
                                      });
                                }
                             });    
                           }
                         });
                        }
                      });
                     }
                    }
                 });
          },
           /**
       * Update student 
       *
       * @param req, res
       * @return response
       */
      updateStudent: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'student/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.member_no != 'undefined'){
                 SET += " member_no=?, ";
                 data.push(input.member_no.trim());
            }
            if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
             }
             SET = SET.trim().substring(0, SET.trim().length-1);             
             QUERY = "UPDATE "+config_constant.EDUSER+"  SET name = '"+input.name+"', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                   if(config.debug){
                        req.app.get('global').fclog("Error Updating : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }else{
                  QUERY = " SELECT name FROM "+config_constant.EDUSER+" WHERE member_no='"+input.member_no+"' ORDER BY id DESC ";
                  req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                    if(err){
                        req.app.get('global').fclog("Error Updating : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                   }
                   else
                    {
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    output.student_name = rows1;
                    mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'student/update_access');
                    res.json(output);
                  }
                  });
                  }                   
             });
           },
       /**
       * All the request of Student with delete Method 
       *
       * @param req, res
       * @return response
       */
      deleteStudent: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'student/delete_access');
           var data = [], output={},student_info_id = [];
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
			     SET = SET.trim().substring(0, SET.trim().length-1);
           QUERY = "UPDATE "+config_constant.EDUSER+" SET status = '-1' ,updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
           req.app.get('connection').query(QUERY,function(err, rows, fields){
               if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Updating : %s ",err);
                      output.status = message.Failure;
								      output.comments = message.Failure;
								      res.json(output);
                      return false;
                    }
               }
               QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+"  where student_ac_no='"+input.member_no+"'";
               req.app.get('connection').query(QUERY,function(err, rows_id, fields){
                   if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);    
                          return false;
                        }
                   }
                 else if(_.size(rows_id)>0){
                    _.each(rows_id, function(item){
                      student_info_id += ','+item.student_info_id;
                      });
                    if(student_info_id != ''){
                      student_info_id = student_info_id.substring(1);
                    }
                  }

                   QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET status = '0' ,updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' where id IN ("+student_info_id+")";
                  req.app.get('connection').query(QUERY,function(err, rows, fields){
                      if(err){
                         if(config.debug){
                              req.app.get('global').fclog("Error Updating : %s ",err);
                              return false;
                            }
                       }
                });

                QUERY = "DELETE FROM "+config_constant.NOTIFICATION+" WHERE member_no = '"+input.member_no+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                      if(config.debug){
                         req.app.get('global').fclog("Error Deleting : %s ",err);
                         res.json({error_code:1, error_msg:message.technical_error});
                         return false;
                      }
                     }
                 });
                 QUERY = "DELETE FROM "+config_constant.EDPARENTUSER+" WHERE student_ac_no ='"+input.member_no+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
                 });
                 QUERY = "DELETE FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no ='"+input.member_no+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Deleting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
                 });    

                  output.timestamp = req.query.timestamp;
                  output.status = message.success;
                  output.comments = message.success;
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student/delete_access');
                  res.json(output);
                });
              });                  
      },
      /**
       * All the request of Student with delete Method 
       *
       * @param req, res
       * @return response
       */
      insertStudentAdd: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'student/add_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.student_no != 'undefined'){
                   where += " AND student_no=? ";
                   data.push(query_str.student_no.trim());
               }
               QUERY = "SELECT id, student_no FROM "+config_constant.STUDENTINFO+" where student_no=? AND status = '0' ";
                 req.app.get('connection').query(QUERY,data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }
                   if(_.size(rows)>0)
                   {
                      output.status = message.success;
                      output.comments = message.success;
                      output.user_list = rows;
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student/add_access');
                      res.json(output);
                     //res.json({'status':message.success, 'comments':message.success});
                   }else{                    
                     res.json({'status':message.failure, 'comments':message.noresult});
                   }
                 });
  },
      
      /**
       * Add student by student code. 
       *
       * @param req, res
       * @return response
       */
       addStudentCode: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'student/addstudentcode_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var SET = "";
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.student_no != 'undefined'){
                   where += " AND student_no=? ";
                   data.push(query_str.student_no.trim());
               }
               if(typeof query_str.student_ac_no != 'undefined'){
                 SET += " student_ac_no=? ";
                 data.push(query_str.student_ac_no);
                }
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" where student_no=? AND status = '0' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }
                   result = rows[0];
                   if(_.size(rows)>0)
                   {
                     QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET status = '1', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE student_no='"+query_str.student_no+"'";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                          if(err){
                               if(config.debug){
                                    req.app.get('global').fclog("Error Updating : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                        }else{
                           QUERY = "INSERT INTO "+config_constant.USERSTUDENTINFO+" SET student_ac_no='"+query_str.student_ac_no+"', student_info_id="+result['id']+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '"; 
                           req.app.get('connection').query(QUERY, data, function(err, rows, result){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Inserting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                             QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE student_no = '"+query_str.student_no+"' ";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                                if(config.debug){
                                    req.app.get('global').fclog("Error Selecting : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                              }else{
                               output.status = message.success;
                               output.comments = message.success;
                               output.user_class = rows;
                               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student/addstudentcode_access');
                               res.json(output);
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
  },
  /**
  * Add student by student code. 
  *
  * @param req, res
  * @return response
  */
   studentLists: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'student/studentlist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={} , class_name =[], student_info_id = [];
              var SET = "";
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.student_ac_no != 'undefined'){
                   where += " AND student_ac_no=? ";
                   data.push(query_str.student_ac_no.trim());
               }
               QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" "+where+"";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting10 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }						
                     else if(_.size(rows) > 0){
                    _.each(rows, function(item){
                      student_info_id += ','+item.student_info_id;
                      });
                    if(student_info_id != ''){
                      student_info_id = student_info_id.substring(1);
                    }

                    QUERY1 = "SELECT name, class_id, student_no,parent_no, parent_ac_no FROM "+config_constant.STUDENTINFO+" where id IN ("+student_info_id+")";
                    req.app.get('connection').query(QUERY1, function(err, rows, fields){
                        if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting1 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                         else if(_.size(rows) <= 0){
                            res.json({'status':message.failure, 'comments':message.nodata});
                         }else{
                         var student_list = {}, class_id = [];
                          output.student_list = [];
                         _.each(rows, function(item){
                          output.student_list.push(item);
                          class_id += ','+ "'"+item.class_id+"'";
                         });
                         if(class_id != ''){
                          class_id = class_id.substring(1);
                         }
                         var item_node = {};
                         var member_no = [];
                        QUERY = "SELECT class_name, class_id, teacher_ac_no FROM "+config_constant.CLASSINFO+" where class_id IN ("+class_id+")";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                        _.each(rows, function(item, index){
                        item_node[item.class_id] = item.class_name;
                        member_no = ','+item.teacher_ac_no;
                      });
                    _.each(output.student_list, function(item, index){
                      if(typeof output.student_list != 'undefined'){
                        output.student_list[index]['class_name'] = item_node[item.class_id];
                      }
                     });
                     if(member_no != 0){
                      member_no = member_no.substring('1');
                     }

                     QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no IN ("+member_no+") and status > '-1'";
                     req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                     if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting11 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                     }   
                     output.teacher_name=(rows1);                           
                     output.timestamp = req.query.timestamp;
                     output.status = message.success;
                     output.comments = message.success;
                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student/studentlist_access');
                     res.json(output);
                   });

                  });
                      }
               });
             }else{
              res.json({'status':message.failure, 'comments':message.nodata});
             }
           }); 
   },
   /**
  * Disconnect student. 
  *
  * @param req, res
  * @return response
  */
  studentDisconnect: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'student/disconnect_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={} , class_name =[], student_info_id = [];
              var SET = "";
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.student_no != 'undefined'){
                   where += " AND student_no=? ";
                   data.push(query_str.student_no.trim());
               }
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+"";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                     }
                     result = rows[0];
                     if(_.size(rows) > 0){
                      QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET status = '0', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" 'WHERE student_no='"+query_str.student_no+"' ";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                        if(err){
                             if(config.debug){
                                  req.app.get('global').fclog("Error Updating : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                        }else{
                          QUERY = "DELETE FROM "+config_constant.USERSTUDENTINFO+" WHERE student_info_id IN ("+result['id']+") ";
                          req.app.get('connection').query(QUERY,  function(err, rows, fields){
                             if(err){
                                 if(config.debug){
                                      req.app.get('global').fclog("Error Deleting : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                }else{
                                  output.status = message.success;
                                  output.comments = message.success;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'student/disconnect_access');
                                  res.json(output);
                               }                                  
                             });
                        }                        
                      });
                     }else{
                        res.json({'status':message.failure, 'comments':message.noresult});
                     }
                        });
  },  
  /**
  * Update student image. 
  *
  * @param req, res
  * @return response
  */
  updateImage: function(req, res){    
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
		    if (!req.file) {
             req.app.get('global').fclog("No file was uploaded.");
            return false;
           }
         var file = req.file;
		 var name = file.originalname.split('.');
         if(file.size>2*1024*1024){
              fs.unlinkSync(file.path);
              res.json({err:'File greater than 2mb is not allowed'});
                 return false;
             }
          if(name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg'){
              var img_name = 'img_'+input.member_no+"."+name[1];    
              var data = fs.readFileSync(file.path);            
              fs.writeFile(config.upload_path+'/profile_image/'+img_name, data, function(err){
                if (err) {
                    res.json({err:'Input File Error'});
                    return false;
                 }
               if(fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
              }
              		  
			    if(input.member_no.substring(0,1) == "4"){         
				  QUERY =  "UPDATE "+config_constant.EDUSER+" SET image="+"'"+img_name+"'"+",updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'WHERE member_no='"+input.member_no+"'";
			  }else{         
			     QUERY =  "UPDATE "+config_constant.EDUSER+" SET image="+"'"+img_name+"'"+",name="+"'"+input.name+"'"+",age="+"'"+input.age+"'"+",phone="+"'"+input.phone+"'"+",updated_at="+"'"+_global.js_yyyy_mm_dd_hh_mm_ss()+"'WHERE member_no='"+input.member_no+"'";
			  }			  
        req.app.get('connection').query(QUERY, function(err, rows, fields){
        if(err){
               if(config.debug){
                  req.app.get('global').fclog("Error Updating : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
              QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE member_no='"+input.member_no+"' ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
            output.status = message.success;
            output.comments = message.success;
            output.name=rows;
            output.img_name=img_name;
            res.json(output);
             }
          });
            }
          });
      });
      }else{
         res.json({err:'Invalid file format!'});
         return false;
       }  
    },

   /**
  * Update student image. 
  *
  * @param req, res
  * @return response
  */
    StudentClassList: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'student/classlist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.member_no != 'undefined'){
                   where += " AND member_no=? ";
                   data.push(query_str.member_no.trim());
               }
               QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no='"+query_str.member_no+"' ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                  req.app.get('global').fclog("Error Selecting1 : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
              id = [];
              _.each(rows, function(item){
                id += ','+"'"+item.student_info_id+"'";  
              });
              if(id != ''){
                id = id.substring(1);
              }
              if(_.size(id) > 0){
              QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+id+") ";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                  req.app.get('global').fclog("Error Selecting2 : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
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
          }
          });
             }else{
              res.json({'status':message.failure, 'comments':message.nodata});
             }
            }
          });

    }
}