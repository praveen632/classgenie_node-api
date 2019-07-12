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
      
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      listStudent: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'addstudent_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
               }
               if(typeof query_str.name != 'undefined'){
                   where += " AND name=? ";
                   data.push(query_str.name.trim());
                }
                if(typeof query_str.email_id != 'undefined'){
                   where += " AND email_id=? ";
                   data.push(query_str.email_id.trim());
                }
                if(typeof query_str.student_no != 'undefined'){
                   where += " AND student_no=? ";
                   data.push(query_str.student_no.trim());
                }                
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY id "+sort_by+"  ";
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
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'addstudent_access');
                res.json(output);
          });
      },
      /**
       * Display image listing of resources.
       *
       * @param req, res
       * @return response
       */
      imageList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'addstudent/list_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              QUERY = "SELECT image FROM "+config_constant.IMAGELIST+"  where type= 2 ";
              req.app.get('connection').query(QUERY, function(err, rows, fields){
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
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'addstudent/list_access');
               res.json(output);
          });
      },
      /**
       * All the request of user with put Method 
       *
       * @param req, res
       * @return response
       */
      updateStudent: function (req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'addstudent/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.image != 'undefined'){
                 SET += " image=?, ";
                 data.push(input.image.trim());
             }
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE id='"+input.id+"'";
              req.app.get('connection').query(QUERY, input.id, function(err, rows, fields){
                 if(err){
                    if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                 }
                 var class_id = rows[0]['class_id']
                QUERY = "SELECT count(*) as total FROM "+config_constant.STUDENTINFO+" WHERE  name = '"+input.name+"' AND class_id = '"+class_id+"' and id!='"+input.id+"'";
                  req.app.get('connection').query(QUERY, [input.student_no], function(err, rows, fields){
                     if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                 }  
                        
                 if(rows[0]['total'] > 0){                  
                    res.json({'status':message.failure, 'comments':message.name_already_exist});
                    return;
                 }else{
                   QUERY = "UPDATE "+config_constant.STUDENTINFO+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.id+"'";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error Updating : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                     }else{
                        QUERY = " SELECT * FROM "+config_constant.STUDENTINFO+" where id='"+input.id+"' ";
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
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'addstudent/update_access');
                              res.json(output);
                            }
                         });
                      }
                  });
                 }
                });
              });
       },

      /**
       * All the request of user with Post Method 
       *
       * @param req, res
       * @return response
       */
      addStudent: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'addstudent_access');
           var data = [], output={};
           var SET = "";
           var parent_no = _global.getCode('P');
           var student_no = _global.getCode('S');           
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
             }
             imageQuery = "SELECT image FROM "+config_constant.IMAGELIST+" where type = 2 ORDER BY RAND() limit 1";
             req.app.get('connection').query(imageQuery, function(err, rows, fields){
               if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
               }else{
                  stu_img = rows[0];
                  var image = stu_img['image'];
             }                  
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT count(*) as total FROM "+config_constant.STUDENTINFO+" WHERE  name = '"+input.name+"' AND class_id = '"+input.class_id+"'";
             req.app.get('connection').query(QUERY, [input.student_no], function(err, rows, fields){
                 if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }

                 }  
                if(rows[0]['total'] > 0){                  
                    res.json({'status':message.failure, 'comments':message.name_already_exist});
                    return;
                 }else{                 
                  QUERY = "INSERT INTO "+config_constant.STUDENTINFO+"  SET "+SET+", parent_no='"+parent_no+"', student_no='"+student_no+"', image='"+image+"', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Inserting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                               }
                          }else{
                              QUERY = " SELECT * FROM "+config_constant.STUDENTINFO+" WHERE class_id='"+input.class_id+"'";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                if(err){
                                   if(config.debug){
                                       req.app.get('global').fclog("Error Selecting : %s ",err);
                                       res.json({error_code:1, error_msg:message.technical_error});
                                       return false;
                                     }
                                }else{
                                /*check student assignment exit or not */
                                  var CurrentDate = moment().format("YYYY-MM-DD");
                                  QUERY = "SELECT * FROM "+config_constant.ASSIGNMENT+" WHERE class_id = '"+input.class_id+"' AND submition_date >= '"+CurrentDate+"' order by submition_date desc";             
                                
                                 req.app.get('connection').query(QUERY, function(err, assign_rows, fields){
                                     if(err){                 
                                       if(config.debug){
                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      } 
                                     } 
                                    if(_.size(assign_rows) > 0){   
                                     _.each(assign_rows, function (item) {              
                                     QUERY = "INSERT INTO " + config_constant.STUDENTASSIGNMENT + " SET assignment_id=" + "'" + item.id + "'" + ", teacher_ac_no= '" + item.member_no + "',class_id='" + item.class_id + "',student_no= '" + student_no + "',submition_date= '" +moment(item.submition_date).format("YYYY-MM-DD")+ "' ";
                                      req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                          if (err) {
                                              if (config.debug) {
                                                  req.app.get('global').fclog("Error Inserting : %s ", err);
                                                  res.json({error_code: 1, error_msg: message.technical_error});
                                                  return false;
                                              }
                                          }
                                      });
                                  });
                                   }  
                                   output.timestamp = req.query.timestamp;
                                   output.status = message.success;
                                   output.comments = message.success;
                                   output.user_list = rows;
                                   mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'addstudent_access');
                                   res.json(output);
                                    });
                                 }
                              });
                           }
                       });
                  }
            });            
           });
       },

       /**
       * All the request of Student with delete Method 
       *
       * @param req, res
       * @return response
       */
     deleteStudent: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(_.extend(req.body, req.query))}, 'addstudent/delete_access');
              var output={}, data = [];
              var input = JSON.parse(JSON.stringify(req.body));
             
			         // select pointweight and classid for updating the points of class
			            QUERY = "SELECT student_no,pointweight,class_id FROM "+config_constant.STUDENTINFO+" WHERE id = '"+input.id+"'";
			               req.app.get('connection').query(QUERY, function(err, rows_total_points_weight_studentinfo, fields){
			               if(err){
			                if(config.debug){
			                req.app.get('global').fclog("Error Selecting : %s1 ",err);
			                res.json({error_code:1, error_msg:message.technical_error});
			                return false;
			                    }
			                   }
			              var class_id = rows_total_points_weight_studentinfo[0]['class_id'];                
			              QUERY = "SELECT pointweight FROM "+config_constant.CLASSINFO+" WHERE class_id = '"+class_id+"'";
			              req.app.get('connection').query(QUERY, function(err, rows_points_classinfo, fields){
			               if(err){
			                if(config.debug){
			                req.app.get('global').fclog("Error Selecting : %s2 ",err);
			                res.json({error_code:1, error_msg:message.technical_error});
			                return false;
			                    }
			                   }
                       
                    if(_.size(rows_points_classinfo) > 0 ){
			              var pointweight_result = rows_total_points_weight_studentinfo[0]['pointweight'];
			              //var pointweight1 = Math.abs(rows_points_classinfo[0]['pointweight'] - pointweight_result);
			            var pointweight1 = +rows_points_classinfo[0]['pointweight'] + -pointweight_result;
                  QUERY = "UPDATE "+config_constant.CLASSINFO+" SET pointweight= "+pointweight1+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id='"+class_id+"'";
			              req.app.get('connection').query(QUERY, function(err, rows, fields){
			               if(err){
			                 if(config.debug){
			                 req.app.get('global').fclog("Error Updating2 : %s ",err);
			                 res.json({error_code:1, error_msg:message.technical_error});
			                 return false;
			                    }
			                  }
			               });
                     }                                 
			               // Delete the student list based on the 'S'(stduent_no) from the remove students class
                     var student_no = rows_total_points_weight_studentinfo[0]['student_no'];
                     QUERY = "DELETE FROM "+config_constant.STUDENTINFO+" WHERE id = ? AND student_no = '"+student_no+"'";
      				       req.app.get('connection').query(QUERY, [input.id], function(err, rows_delete_student_info, fields){
      				         if(err){
      				           if(config.debug){
      				           req.app.get('global').fclog("Error Deleting1 : %s1 ",err);
      				           res.json({error_code:1, error_msg:message.technical_error});
      				           return false;
      				             }
      				           }
                         // getting the group id based on the student no
                         QUERY = "SELECT group_id FROM "+config_constant.GROUPINFO+" WHERE student_no = '"+student_no+"'";
                         req.app.get('connection').query(QUERY, data, function(err, rows_group_id, fields){
                            if(err){
                               if(config.debug){
                               req.app.get('global').fclog("Error selecting : %s2 ",err);
                               res.json({error_code:1, error_msg:message.technical_error});
                               return false;
                                 }
                               }
                               var group_id = [];               
                                _.each(rows_group_id, function(item){
                               group_id += ','+"'"+item.group_id+"'";
                                });
                                if(group_id != ''){
                                  group_id = group_id.substring(1);
                                }                                   
                              if(_.size(group_id) > 0){       
                              // getting the count of student in the group
                              QUERY = "SELECT group_id,COUNT(status) as COUNT FROM "+config_constant.GROUPINFO+" WHERE group_id IN ("+group_id+") GROUP BY group_id";
                              req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                               if(err){
                                 if(config.debug){
                                 req.app.get('global').fclog("Error Select : %s2 ",err);
                                 res.json({error_code:1, error_msg:message.technical_error});
                                 return false;
                                   }
                                 }                              
                                 COUNT1 = [];
                                _.each(rows1, function(item){
                                  if(item.COUNT<= '1'){
                                    COUNT1 +=','+"'"+item.group_id+"'";
                                    }                               
                               }); 
                               if(COUNT1 != ''){
                                COUNT1 = COUNT1.substring(1);
                               }
                               if(_.size(COUNT1) > 0){
                              //update the group point during the student count is 1
                              QUERY = "UPDATE  "+config_constant.GROUP+" SET pointweight = '0' where id IN("+COUNT1+")";
                              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                     if(config.debug){
                                     req.app.get('global').fclog("Error Deleting2 : %s ",err);
                                     res.json({error_code:1, error_msg:message.technical_error});
                                     return false;
                                       }
                                     }
                                   });
                            }
                             QUERY = "DELETE FROM "+config_constant.GROUPINFO+" WHERE student_no = '"+student_no+"'";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                 if(err){
                                   if(config.debug){
                                   req.app.get('global').fclog("Error Deleting : %s1 ",err);
                                   res.json({error_code:1, error_msg:message.technical_error});
                                   return false;
                                     }
                                   }
                                 });
                           });
                          }
                          QUERY = "Delete  FROM "+config_constant.USERSTUDENTINFO+" WHERE student_info_id= '"+input.id+"' ";
            			        req.app.get('connection').query(QUERY, function(err, rows_delete_user_student_info, fields){
    				                if(err){
    				                 if(config.debug){
    				                   req.app.get('global').fclog("Error Deleteing : %s2 ",err);
    				                   res.json({error_code:1, error_msg:message.technical_error});
    				                   return false;
    				                     }
    				                  }
            			            QUERY = "Delete  FROM "+config_constant.STUDENTSTORY+" WHERE student_no ='"+student_no+"'  ";
            			            req.app.get('connection').query(QUERY, function(err, rows_delete_students_story, fields){
            				            if(err){
            				              if(config.debug){
            				                req.app.get('global').fclog("Error Deleting : %s3 ",err);
            				                 res.json({error_code:1, error_msg:message.technical_error});
            				                 return false;
            				                  }
            				                }
            			              QUERY = "Delete  FROM "+config_constant.STUDENTASSIGNMENT+" WHERE student_no ='"+student_no+"'  ";
            			               req.app.get('connection').query(QUERY, function(err, rows_delete_sudent_assignment, fields){
            				              if(err){
            				               if(config.debug){
            				                req.app.get('global').fclog("Error Deleting : %s4 ",err);
            				                res.json({error_code:1, error_msg:message.technical_error});
            				                   return false;
            				                    }
            				                  }
            			              QUERY = "Delete  FROM "+config_constant.STUDENTINFO_POINT+" WHERE student_info_no ='"+student_no+"'  ";
            			               req.app.get('connection').query(QUERY, function(err, rows_stduent_info_point, fields){
            				              if(err){
            				               if(config.debug){
            				               req.app.get('global').fclog("Error Deleting : %s5 ",err);
            				               res.json({error_code:1, error_msg:message.technical_error});
            				               return false;
            				                  }
            				                }
            			             QUERY = "Delete FROM "+config_constant.CLASSCOMMENT+" WHERE student_no ='"+student_no+"' ";
            			              req.app.get('connection').query(QUERY, function(err, rows_class_stories, fields){
            				            if(err){
            				             if(config.debug){
            				             req.app.get('global').fclog("Error Deleting : %s6 ",err);
            				             res.json({error_code:1, error_msg:message.technical_error});
            				             return false;
            				                  }
            				                }
            			             QUERY = "UPDATE "+config_constant.CLASSSTORIES+" SET student_no = '', username = '' WHERE student_no = '"+student_no+"'";
            			             req.app.get('connection').query(QUERY, function(err, rows_class_stories, fields){
            				            if(err){
            				              if(config.debug){
            				              req.app.get('global').fclog("Error Deleting : %s7 ",err);
            				              res.json({error_code:1, error_msg:message.technical_error});
            				              return false;
            				                 }
            				              }
            			             QUERY = "Delete  FROM "+config_constant.TEACHERSTUDENTREMARK+" WHERE student_no ='"+student_no+"'  ";
            			              req.app.get('connection').query(QUERY, function(err, rows_teacher_parent_remark, fields){
            				             if(err){
            				               if(config.debug){
            				               req.app.get('global').fclog("Error Deleting : %s8 ",err);
            				               res.json({error_code:1, error_msg:message.technical_error});
            				               return false;
            				                  }
            				                }            			            
            			                 QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" ORDER BY id DESC ";
            			                 req.app.get('connection').query(QUERY, function(err, rows, fields){
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
              			                    mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'addstudent/delete_access');
              			                    res.json(output);                                         
                                        });
                                 });
                              });
                           });
                        });
                      });
			             });
			            });	        
			      });
          });        
			    });
			  });
			},

        /**
       * All the request for Add Multiple Student  manully and Via CSV
       *
       * @param req, res
       * @return response
       */
       multiple_student: function (req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'addstudent_access');
         var output={};
         var SET = "";
         var input = JSON.parse(JSON.stringify(req.body));
         imageQuery = "SELECT image FROM "+config_constant.IMAGELIST+" where type = 2 ORDER BY RAND() limit 1";
         req.app.get('connection').query(imageQuery, function (err, rows, fields) {
             if (err) {
               if (config.debug) {
                req.app.get('global').fclog("Error Selecting : %s ", err);
                res.json({error_code: 1, error_msg: message.technical_error});
               return false;
             }
           } else {
                stu_img = rows[0];
                var image = stu_img['image'];
            }
            input.data = JSON.parse(input.data);                    
            var value=''; 
            var student_names = ''; 
              _.forEach(input.data, function (obj) {                          
                  student_names += ','+"'"+obj.name.trim()+"'";
                  var parent_no = _global.getCode('P');
                  var student_no = _global.getCode('S'); 
                  var created_at = _global.js_yyyy_mm_dd_hh_mm_ss();
                  value += "('"+obj.name.trim()+"','"+student_no+"','"+parent_no+"','"+image+"','"+obj.class_id+"','0','"+created_at+"'),";
              });
                       
              if (student_names != '') {
                    student_names = student_names.substring(1);
                }                      
              if(value != ''){
                 value = value.substring(0, value.length-1);
               }
            QUERY = "SELECT name FROM "+config_constant.STUDENTINFO+" WHERE name in ("+student_names+") AND class_id='"+input.data[0].class_id+"'";
            req.app.get('connection').query(QUERY, function(err, stu_names, fields){
               if(err){                 
                 if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                } 
               }
               var all = '';
             if(_.size(stu_names) > 0){
              _.forEach(stu_names,function(item){
               all += ','+item.name;    
              });                     
               if (all != '') {
                    all_values = all.substring(1);
                }
              output.names = all_values;
              output.exist = "exist";
              output.status = message.failure;
              res.json(output);
             }else{
            var QUERY = "insert into ed_studentinfo (name,student_no,parent_no,image,class_id,status,created_at) VALUES "+value;
            
            req.app.get('connection').query(QUERY,function (err, rows, fields) {
                if (err) {
                    req.app.get('global').fclog("Error Inserting: %s ", err);
                    return false;
                }else{
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                            
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'addstudent/delete_access');
                      res.json(output);
                    }
              });
          }
        });
          });
       }
     }
