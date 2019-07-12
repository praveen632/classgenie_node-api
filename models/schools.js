var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var wp_user = require('./wp_user');
module.exports = {
  /**
       * All the request of school with GET method and execute in search operation.
       *
       * @param req, res
       * @return response
       */
      searchSchools: function (req, res){
            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/search_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.school_name != 'undefined'){
                 where += " AND school_name like ? ";
                 data.push(query_str.school_name.trim()+"%");
             }
             if(typeof query_str.address != 'undefined'){
                 where += " AND address like ? ";
                 data.push(query_str.address.trim()+"%");
              }
              if(typeof query_str.school_id != 'undefined'){
                 where += " AND school_id like ? ";
                 data.push(query_str.school_id.trim()+"%");
              }
             
             QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" "+where+" and status >= '0' and status != '2' ORDER BY school_id DESC ";
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
                output.school_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'schools/search_access');
                res.json(output);
          });
      },

      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      schoolList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/list_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.member_no != 'undefined'){
                 where += " AND member_no like ? ";
                 data.push(query_str.member_no.trim()+"%");
             }
             QUERY = "SELECT school_id FROM "+config_constant.EDUSER+" WHERE member_no = '"+query_str.member_no+"' ";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error in Selecting: %s",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                 }else if(_.size(rows)>0){
                      QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id != '"+rows[0]['school_id']+"' and status >= '0' and status != '2' ORDER BY school_name asc "+limit+" ";
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
                              output.school_list = rows;
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'schools/list_access');
                              res.json(output);
                             });
                    }else{ 
                      QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" "+limit+" ";
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
                        output.school_list = rows;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'schools/list_access');
                        res.json(output);
                  });
                     }
                });                   
      },
      /**
       * Return teacher list.
       *
       * @param req, res
       * @return response
       */
       teacherList: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/teacherlist_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.school_id != 'undefined'){
                 where += " AND school_id like ? ";
                 data.push(query_str.school_id.trim()+"%");
             }
             QUERY = "SELECT image, name, email FROM "+config_constant.EDUSER+" WHERE school_id='"+query_str.school_id+"' AND status = '1' "
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }                     
                      if(_.size(rows) == 0){
                         res.json({'status':message.failure, 'comments':"You are First Teacher"});
                      }else{
                          output.timestamp = req.query.timestamp;
                          output.status = message.success;
                          output.comments = message.success;
                          output.Teacher_list = rows;
                          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/teacherlist_access');
                          res.json(output);                       
                  }
                });
       },
       
       /**
       * Teacher list for limit.
       *
       * @param req, res
       * @return response
       */  
       teacherListLimit: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/teacherlistlimit_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             var page_size = 5;
             var start_record_index = (query_str.page_number-1)*5;
               
             var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index>-1 && page_size != '') ? " LIMIT "+start_record_index+" ,"+page_size:" LIMIT 0,"+page_size;
             if(typeof query_str.school_id != 'undefined'){
                 where += " AND school_id like ? ";
                 data.push(query_str.school_id.trim()+"%");
             }
             QUERY = "SELECT id, image, name, email, status, member_no FROM "+config_constant.EDUSER+" WHERE school_id='"+query_str.school_id+"' AND status > '-1' AND type != '1' ORDER BY id desc "+limit+" "
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                QUERY = "SELECT count(id) as count FROM "+config_constant.EDUSER+" WHERE school_id='"+query_str.school_id+"' AND status > '-1' AND type != '1' "
                 req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                  if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }
                    output.count_list = rows1;
                    if(_.size(rows) == 0){
                       res.json({'status':message.failure, 'comments':"You are First Teacher"});
                    }else{
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        output.Teacher_list = rows;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/teacherlistlimit_access');
                        res.json(output);
                      }
                    });
               }
          });
       },
       
      /**
       * Save school id and return teacher list.
       *
       * @param req, res
       * @return response
       */
      joinSchools: function(req, res){
       
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schools/add/request_access');
           var data = [], output={}, teacher_ac_no='';
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));          
            if(typeof input.school_id != 'undefined'){
                 SET += " school_id=?, ";
                 data.push(input.school_id.trim());
            }
           
            SET = SET.trim().substring(0, SET.trim().length-1);
            if(input.type == '1'){
               QUERY = "SELECT type FROM "+config_constant.EDUSER+" WHERE school_id = '"+input.school_id+"' AND status > '-1' ";
             }else{
               QUERY = "SELECT type FROM "+config_constant.EDUSER+" WHERE school_id = '"+input.school_id+"' and member_no = '"+input.member_no+"' AND status > '-1' ";
            }           
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error Updating : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                }
               }
               type = [];
               _.each(rows, function(item){
                  type += item.type;
               });
               for (var i = type.length - 1; i >= 0; i--) {
                if(type[i] == '1'){
                    res.json({'status':message.failure, 'comments':message.already_principal});
                    return false;
                  }
            }
            QUERY = "UPDATE "+config_constant.EDUSER+"  SET "+SET+" WHERE member_no= '"+input.member_no+"'";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Updating : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                  QUERY = "INSERT INTO "+config_constant.SCHOOLTEACHER_REQ+" SET school_id='"+input.school_id+"', teacher_ac_no = '"+input.member_no+"' ";
                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                     if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Inserting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                          }                 
                }else{
                   QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+input.school_id+"' ";
				           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting10 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }else{
						            QUERY = "UPDATE "+config_constant.NOTIFICATION+" SET "+SET+" WHERE member_no= '"+input.member_no+"'";
					              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                            if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                            }
                          });					  
						  
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        output.user_list = rows;
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/add_access');
                        res.json(output);

                        //wp_user.wp_school(req, res, input.member_no, input.school_id);
                      }
                   });
             }
           });
                }
              });
            
            });
      },
      /**
       * Change school.
       *
       * @param req, res
       * @return response
       */
       changeSchools: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schools/change_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
           SET = SET.trim().substring(0, SET.trim().length-1);
           // deactive teacher account ed_user       
            QUERY = "UPDATE "+config_constant.EDUSER+"  SET status = '-1' WHERE member_no= '"+input.member_no+"'";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error Updating : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
              }else{
                    output.status = message.success;
                    output.comments = message.success;
                    mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/add_access');
                    res.json(output);
                  }                  
              });
          },   
             
       /**
       * Add schools.
       *
       * @param req, res
       * @return response
       */
       addSchoolsList: function(req, res, input){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schools/addschoolslist_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
          
            if(typeof input.school_name != 'undefined'){
                 SET += " school_name=?, ";
                 data.push(input.school_name.trim());
            }
            if(typeof input.address != 'undefined'){
                 SET += " address=?, ";
                 data.push(input.address.trim());
            }
            if(typeof input.city != 'undefined'){
              SET += " city=?, ";
              data.push(input.city.trim());
            }
            if(typeof input.state != 'undefined'){
              SET += " state=?, ";
              data.push(input.state.trim());
            }
            if(typeof input.country != 'undefined'){
              SET += " country=?, ";
              data.push(input.country.trim());
            }
            if(typeof input.pincode != 'undefined'){
              SET += " pincode=?, ";
              data.push(input.pincode.trim());
            }
            if(typeof input.phone != 'undefined'){
              SET += " phone=?, ";
              data.push(input.phone.trim());
            }
            if(typeof input.email_id != 'undefined'){
              SET += " email_id=?, ";
              data.push(input.email_id.trim());
            }
            if(typeof input.web_url != 'undefined'){
              SET += " web_url=?, ";
              data.push(input.web_url.trim());
            }
            
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "INSERT INTO "+config_constant.SCHOOLS+" SET "+SET+", status = '0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
              req.app.get('connection').query(QUERY, data, function(err, rows, field){
                 if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Inserting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                 }else{
                   QUERY = "SELECT school_id FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+rows.insertId+"' "; 
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }else{
                     result = rows[0];
                     QUERY = "INSERT INTO "+config_constant.SCHOOLTEACHER_REQ+" SET school_id = '"+result['school_id']+"', teacher_ac_no = '"+input.member_no+"' ";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Inserting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                         }else{
                           QUERY = "UPDATE "+config_constant.EDUSER+" SET school_id = '"+result['school_id']+"' WHERE member_no = '"+input.member_no+"' ";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Updating : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                 }else{
                                   QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+result['school_id']+"' ";
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
                                  output.teacher_list = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/addschoolslist_access');
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
            },


            /**
       * Add schools portal.
       *
       * @param req, res
       * @return response
       */
       addschoolslistportal: function(req, res, input){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'schools/addschoolslist_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
          
            if(typeof input.school_name != 'undefined'){
                 SET += " school_name=?, ";
                 data.push(input.school_name.trim());
            }
            if(typeof input.address != 'undefined'){
                 SET += " address=?, ";
                 data.push(input.address.trim());
            }
            if(typeof input.city != 'undefined'){
              SET += " city=?, ";
              data.push(input.city.trim());
            }
            if(typeof input.state != 'undefined'){
              SET += " state=?, ";
              data.push(input.state.trim());
            }
            if(typeof input.country != 'undefined'){
              SET += " country=?, ";
              data.push(input.country.trim());
            }
            if(typeof input.pincode != 'undefined'){
              SET += " pincode=?, ";
              data.push(input.pincode.trim());
            }
            if(typeof input.phone != 'undefined'){
              SET += " phone=?, ";
              data.push(input.phone.trim());
            }
            if(typeof input.email_id != 'undefined'){
              SET += " email_id=?, ";
              data.push(input.email_id.trim());
            }
            if(typeof input.web_url != 'undefined'){
              SET += " web_url=?, ";
              data.push(input.web_url.trim());
            }
            
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "INSERT INTO "+config_constant.SCHOOLS+" SET "+SET+", status = '0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
              req.app.get('connection').query(QUERY, data, function(err, rows, field){
                 if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Inserting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                 }else{
                   QUERY = "SELECT school_id FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+rows.insertId+"' "; 
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }else{
                     result = rows[0];
                    /* QUERY = "INSERT INTO "+config_constant.SCHOOLTEACHER_REQ+" SET school_id = '"+result['school_id']+"' ";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Inserting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                         }else{*/
                           QUERY = "UPDATE "+config_constant.EDUSER+" SET school_id = '"+result['school_id']+"' WHERE member_no = '"+input.member_no+"' ";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                  if(config.debug){
                                      req.app.get('global').fclog("Error Updating : %s ",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                 }else{
                                   QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+result['school_id']+"' ";
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
                                  output.teacher_list = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/addschoolslist_access');
                                  res.json(output);
                                 }
                               });
                              }
                            });
                        // }
                     
                    } 
                   });
                 }
             });
            },

            /**
       * All the request of School Update by Post Method 
       *
       * @param req, res
       * @return response
       */
       school_update: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'school_update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.school_name != 'undefined'){
                 SET += " school_name=?, ";
                 data.push(input.school_name.trim());
             }
          if(typeof input.web_url != 'undefined'){
                 SET += " web_url=?, ";
                 data.push(input.web_url.trim());
             }
          if(typeof input.address != 'undefined'){
                 SET += " address =?, ";
                 data.push(input.address.trim());
             }
          if(typeof input.city != 'undefined'){
                 SET += " city=?, ";
                 data.push(input.city.trim());
             }
          if(typeof input.state != 'undefined'){
                 SET += " state=?, ";
                 data.push(input.state.trim());
             }
          if(typeof input.country != 'undefined'){
                 SET += " country=?, ";
                 data.push(input.country.trim());
             }          
          if(typeof input.pin_code != 'undefined'){
                 SET += " pin_code=?, ";
                 data.push(input.pin_code.trim());
             }
          if(typeof input.phone != 'undefined'){
                 SET += " phone=?, ";
                 data.push(input.phone.trim());
             }                              
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE  school_id='"+input.school_id+"'";      
             req.app.get('connection').query(QUERY, function(err, rows, fields){
                 if(err){
                  if(config.debug){
                   req.app.get('global').fclog("Error Selecting : %s ",err);
                   res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                  }
                 }
                 else if(_.size(rows)<0){
                     res.json({'status':message.failure, 'comments':message.nodata});
                  }
                 else
                 {
                    QUERY = "UPDATE "+config_constant.SCHOOLS+" SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" 'WHERE school_id='"+input.school_id+"'";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                         req.app.get('global').fclog("Error Selecting : %s ",err);
                         res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                   }
                  }else{
                   QUERY = " SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id ='"+input.school_id+"' ORDER BY school_id DESC ";
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
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'school_update_access');
                        res.json(output);
                      }
                   });
                }
            });
           }
       });     
},

       /**
       * teacher approve
       *
       * @param req, res
       * @return response
       */
      teacherApprove: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'school_update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));

           if(typeof input.school_id != 'undefined'){
                 SET += " school_id=?, ";
                 data.push(input.school_id.trim());
             }
           if(typeof input.member_no != 'undefined'){
                 SET += " member_no=?, ";
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
                 QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE member_no = '"+input.member_no+"' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                        req.app.get('global').fclog("Error Selecting1 : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                    }else if(_.size(rows) > 0){
                         QUERY = "UPDATE "+config_constant.EDUSER+" SET status = '1' WHERE member_no = '"+input.member_no+"' ";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                             if(err){
                              if(config.debug){
                                req.app.get('global').fclog("Error in Updating: %s",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                             }else{
                                QUERY = "SELECT teacher_ac_no FROM "+config_constant.SCHOOLTEACHER_REQ+" WHERE teacher_ac_no = '"+input.member_no+"' ";
                                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                   if(err){
                                    if(config.debug){
                                      req.app.get('global').fclog("Error in Selecting2: %s",err);
                                      res.json({error_code:1, error_msg:message.technical_error});
                                      return false;
                                    }
                                   }else if(_.size(rows) > 0){
                                       QUERY = "UPDATE "+config_constant.SCHOOLTEACHER_REQ+" SET status = '1' WHERE teacher_ac_no = '"+input.member_no+"' ";
                                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                           if(err){
                                            if(config.debug){
                                              req.app.get('global').fclog("Error in Updating: %s",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                            }
                                           }  
                                       });
                                   }else{
                                      QUERY = "INSERT INTO "+config_constant.SCHOOLTEACHER_REQ+" SET school_id = '"+input.school_id+"', teacher_ac_no = '"+input.member_no+"', status = '1' ";
                                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                        if(err){
                                          if(config.debug){
                                            req.app.get('global').fclog("Error in Inserting: %s",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                        }
                                      });
                                   }
                                   QUERY = "SELECT class_id FROM "+config_constant.CLASSINFO+" WHERE teacher_ac_no = '"+input.member_no+"' ";
                                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                      if(err){
                                        if(config.debug){
                                          req.app.get('global').fclog("Error in Selecting: %s",err);
                                          res.json({error_code:1, error_msg:message.technical_error});
                                          return false; 
                                        }
                                      }else if(_.size(rows) > 0){
                                        QUERY = "UPDATE "+config_constant.CLASSINFO+" SET school_id = '"+input.school_id+"' WHERE teacher_ac_no = '"+input.member_no+"' ";
                                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                          if(err){
                                            if(config.debug){
                                              req.app.get('global').fclog("Error in Updating: %s",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false; 
                                            }
                                          }
                                        });
                                      }
                                   });
                                });
                             }
                             QUERY = "SELECT * FROM " + config_constant.NOTIFICATION + " where (member_no = '"+input.member_no+"' and status = 1) and device_id NOT IN ("+device_id+") ";
                             req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                if (err) {
                                    if (config.debug) {
                                        req.app.get('global').fclog("Error Selecting : %s ", err);
                                        res.json({error_code: 1, error_msg: message.technical_error});
                                        return false;
                                    }
                                }
                                if (typeof input.title == 'undefined' || input.title == "") {
                                    input.title = "Teacher approve from Classgenie";
                                }         
                                _.each(rows, function (item) {
                                    if (config.env === 'production') {
                                        _global.pushNotification({module_id: 6, message: _global.cutString(input.title, 20) + '..', title: classNameRows[0]['class_name']+'-Assignment', device_id: item.device_id, member_no: parent_ac_no});
                                    }
                                });
                            });
                         });
                    }else{
                      res.json({'status':message.failure, 'comments':message.nodata});
                    }
                 });
                 output.timestamp = req.query.timestamp;
                 output.status = message.success;
                 output.comments = message.success;
                 res.json(output);
            }
          });
      },
	  
	   schoolDetails: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/school_details');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.school_id != 'undefined'){
                 where += " AND school_id like ? ";
                 data.push(query_str.school_id.trim()+"%");
             }
             QUERY = "SELECT * FROM "+config_constant.SCHOOLS+" WHERE school_id = '"+query_str.school_id+"' ";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error in Selecting: %s",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
               }            
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                output.school_details = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'schools/school_details');
                res.json(output);
             });                      
      },
	  
	  
	   CountriesSearch: function (req, res) {
		   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/countries');
		    var query_str = url.parse(req.url,true).query;
            var data = [], output={};
            var where = " WHERE 1=1 ";
			
			if(typeof query_str.countryName!= 'undefined'){
                 where += " country_name like ? ";
                 data.push(query_str.countryName.trim()+"%");
             }
			
			QUERY = "SELECT * FROM "+ config_constant.COUNTRIES +" where country_name like '%"+query_str.countryName+"%'";            
             req.app.get('connection').query(QUERY, function (err, countries, fields) {
                 if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error in Selecting: %s",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
               }    else{
				   output.timestamp = req.query.timestamp;
                   output.status = message.success;
                  
                   output.countries = countries;
				   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'schools/countries');
                   res.json(output);
                }
                 
            });
        
    },
	  
	   checkUser: function (req, res) {
		   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, '/schools/checkuser');
		    var query_str = url.parse(req.url,true).query;
            var data = [], output={};
            var where = " WHERE 1=1 ";
					
			QUERY = "SELECT school_id as total  FROM "+config_constant.EDUSER+"  where type='"+query_str.role+"' AND school_id='"+query_str.school_id+"'";            
             req.app.get('connection').query(QUERY, function (err, rows, fields) {
                 if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error in Selecting: %s",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
               }else{
			   
                if(rows[0]['total'] > 0)
				{ 
 	output.existStatus = 'exist';
		
			}
			   }
				   output.timestamp = req.query.timestamp;
                   output.status = message.success;
                   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/schools/checkuser');
                   res.json(output);
                
            });
        
    },
	
	  /**
       * Return teacher list for Portal
       *
       * @param req, res
       * @return response
       */
         portal_teacherList: function(req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'schools/portal_teacherlist');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.school_id != 'undefined'){
                 where += " AND school_id like ? ";
                 data.push(query_str.school_id.trim()+"%");
             }
             QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE school_id='"+query_str.school_id+"' AND  type in ('1','2','5') AND status > '-1' "
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }                     
                      if(_.size(rows) == 0){
                         res.json({'status':message.failure, 'comments':"You are First Teacher"});
                      }else{
                          output.timestamp = req.query.timestamp;
                          output.status = message.success;
                          output.comments = message.success;
                          output.Teacher_list = rows;
                          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'schools/portal_teacherlist');
                          res.json(output);                       
                  }
                });
       },
	
 }
