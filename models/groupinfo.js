var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('js-md5'); 
var _global = require('../common/global');
var Base64 = require('js-base64').Base64;
module.exports = {
      /**
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
        grouplist:function (req, res){               
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'groupinfo_access');
                  var query_str = url.parse(req.url,true).query;
                  var data = [], output={};
                  var where = " WHERE 1=1 ";
                  var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
                  var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc "); 
                  if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
                }    
               QUERY = " SELECT group_name,id,pointweight FROM "+config_constant.GROUP+" where class_id="+"'"+query_str['class_id']+"'";
               req.app.get('connection').query(QUERY, function(err, rows, fields){
                if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                }
				        if(_.size(rows)==0){
                     output.timestamp = req.query.timestamp;
                     output.status = message.failure;
                     output.comments = message.failure;
                     output.group_list = rows;
	                   res.json(output);
                     return false;
                   }
          				 var group_id = '';
          				 _.each(rows, function(item){
          				    group_id += item.id+',';
          				 });
          				 if(group_id){
          				    group_id = group_id.substring(0, group_id.length-1);
          				 }
          				 if(group_id){
          				  QUERY = "SELECT group_id, count(student_no) as total_no_of_student FROM "+config_constant.GROUPINFO+" where group_id in ("+group_id+") GROUP BY group_id";
          					var obj_group_info = {};
          					req.app.get('connection').query(QUERY, function(err, rows_groupinfo, fields){
          						_.each(rows_groupinfo, function(item){
          							obj_group_info[item.group_id] = item.total_no_of_student;
          						 });
          						 _.each(rows, function(item, index){
          						    if(obj_group_info[rows[index].id]){
          							   rows[index].total_no_of_student = obj_group_info[rows[index].id];
          							}else{
          							   rows[index].total_no_of_student = 0;
          							}
          						 });
          						  output.group_list = rows;
          						  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo_access');
          							output.timestamp = req.query.timestamp;
          							output.status = message.success;
          							output.comments = message.success;
          						  res.json(output);
          					});
          				 }
                  });       		 
                },
    
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
       studentlist:function (req, res){        
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'groupinfo/studentlist_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
               var where = " WHERE 1=1 ";
              if(typeof query_str.class_id != 'undefined'){
                    where += " AND class_id=? ";
                    data.push(query_str.class_id.trim());
                }                    
                QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+"  ";  
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
                  output.group_list = rows;
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo/studentlist_access');
                  res.json(output); 
          });               
       },

       /**
       * Add group.
       *
       * @param req, res
       * @return response
       */
       addgroup: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'groupinfo_access');
           var data = [], output={};
           var SET = "";var no=1;
           var input = JSON.parse(JSON.stringify(req.body));
           var input_data  = input['group'];
           var data= JSON.parse(Base64.decode(input_data)); 
           var input_data  = input['student_list'];
           QUERY = "SELECT * FROM "+config_constant.GROUP+" where group_name="+"'"+data[0]['group_name']+"'and class_id= "+"'"+data[0]['class_id']+"'";
           req.app.get('connection').query(QUERY, function(err, rows, fields){
               if(err){
                   if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                 }
                 else if(_.size(rows)>0){
                    output.message = message.failure;
                    output.status = message.name_already_exist;
                    res.json(output);
                    return false;
                 }else{
                   QUERY = "INSERT INTO "+config_constant.GROUP+" SET class_id="+"'"+data[0]['class_id']+"'" +",group_name= "+"'"+data[0]['group_name']+"'"; 
                   req.app.get('connection').query(QUERY, function(err, rows, result){
                   var group_id = rows['insertId']; 
                   for(var i=0;i<_.size(data);i++){
                     QUERY = "INSERT INTO "+config_constant.GROUPINFO+" SET class_id="+"'"+data[i]['class_id']+"'" +",group_id= "+"'"+group_id+"'"+",student_no="+"'"+data[i]['student_no']+"'" +",created_at="+"'"+_global.js_yyyy_mm_dd()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd()+"'";    
                     req.app.get('connection').query(QUERY, function(err, rows, result){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                        });                     
                       }
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        //output.user_list = rows;console.log(output);
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo_access');
                        res.json(output);                        
                   });
                 }
               });                 
           },

           /**
           * Add group.
           *
           * @param req, res
           * @return response
           */ 
           group_info:function(req,res){
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'groupinfo/group_info_access');
                      var output={};
                      var query_str = url.parse(req.url,true).query;
                      QUERY = "SELECT group_name FROM "+config_constant.GROUP+" where group_name="+"'"+query_str['group_name']+"'and class_id= "+"'"+query_str['class_id']+"'";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                        if(err){
                           if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                         }
                         else if(_.size(rows)>0){
                            output.message = message.failure;
                            output.status = message.name_already_exist;
                            res.json(output);
                            return false;
                         }
                       });
                   },

                   /**
                   * Add group.
                   *
                   * @param req, res
                   * @return response
                   */
                    deletegroup:function(req,res){
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'groupinfo/delete_access');
                            var output={};
                            var input = JSON.parse(JSON.stringify(req.body));
                            QUERY = "DELETE FROM "+config_constant.GROUP+" WHERE class_id='"+input.class_id+"'AND id='"+input.group_id+"'";
                            req.app.get('connection').query(QUERY,function(err, rows, fields){
                                  if(err){
                                    if(config.debug){
                                        req.app.get('global').fclog("Error Deleting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                  }
                                  QUERY = "DELETE FROM "+config_constant.GROUPINFO+" WHERE class_id='"+input.class_id+"'AND group_id='"+input.group_id+"'";
                                  req.app.get('connection').query(QUERY,function(err, rows, fields){
                                  if(err){
                                    if(config.debug){
                                        req.app.get('global').fclog("Error Deleting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                    }
                                  });
                                  QUERY = "SELECT * FROM "+config_constant.GROUPINFO+"  WHERE class_id='"+input.class_id+"'AND group_id='"+input.group_id+"'";
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
                                       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo/delete_access');
                                       res.json(output);
                                    }
                                 });
                            });
                       },

                       /**
                       * Add group.
                       *
                       * @param req, res
                       * @return response
                       */
                       group_studentlist:function (req, res){
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'groupinfo/group_studentlist_access');
                              var query_str = url.parse(req.url,true).query;
                              var input = JSON.parse(JSON.stringify(req.body));
                              var data = [], output={};
                              var where = " WHERE 1=1 ";
                              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
                              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
                                  if(typeof query_str.group_id != 'undefined'){
                                   where += " AND group_id=? ";
                                   data.push(query_str.group_id.trim());
                                }   
                                if(typeof query_str.class_id != 'undefined'){
                                 where += " AND class_id=? ";
                                 data.push(query_str.class_id.trim());
                               }   
                               QUERY = "SELECT student_no FROM "+config_constant.GROUPINFO+" "+where+"  ";  
                               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                  if(err){
                                      if(config.debug){
                                            req.app.get('global').fclog("Error Selecting : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                        }
                          				       if(_.size(rows)==0){
                                           output.timestamp = req.query.timestamp;
                                           output.status = message.failure;
                                           output.comments = message.failure;
                                           output.group_list = rows;
                          				         res.json(output);
                                        }
                                        var groupinfo=[];var student_no='';var groupname;var student_info={};var obj={};
                                        if(_.size(rows)>0){
                                            for(var i=0;i<_.size(rows);i++){
                                                  var group_name={};
                                                 group_name.name = rows[i].group_name;
                                                student_no += ",'"+rows[i].student_no+"'";
                                            }
                                            obj.group_info=group_name;
                                            QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" where student_no in ("+student_no.substring(1)+")";          
                                            req.app.get('connection').query(QUERY, data, function(err, rows1, fields){ 
                                            var studentinfo_response = [];
                                            studentinfo_response = rows1;
                                            output.timestamp = req.query.timestamp;
                                            output.status = message.success;
                                            output.comments = message.success;
                                            output.group_info_id = input.group_id;
                                            output.student_info = studentinfo_response;
                                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo/group_studentlist_access');
                                            res.json(output); 
                                                 
                                          });  
                                         }
                                   });               
                                },

                       /**
                       * Add group.
                       *
                       * @param req, res
                       * @return response
                       */                
                       updategroup:function(req,res){
                               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'groupinfo/update_access');
                               var data = [], output={};
                               var SET = "";var no=1;
                               var input = JSON.parse(JSON.stringify(req.body));
                               var input_data  = input['group'];
                               var data= JSON.parse(Base64.decode(input_data));
                               QUERY = "SELECT * FROM "+config_constant.GROUP+" where group_name="+"'"+data[0]['group_name']+"' and class_id= "+"'"+data[0]['class_id']+"' and id != '"+data[0]['group_id']+"'";
                               req.app.get('connection').query(QUERY, function(err, rows, fields){
                                   if(err){
                                       if(config.debug){
                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                     }                                     
                                     else if(_.size(rows)>0){
                                        output.message = message.failure;
                                        output.status = message.name_already_exist;
                                        res.json(output);
                                        return false;
                                     }else{ 
                                       QUERY = "DELETE FROM "+config_constant.GROUPINFO+" WHERE class_id='"+data[0]['class_id']+"'AND group_id='"+data[0]['group_id']+"'";
                                       req.app.get('connection').query(QUERY,function(err, rows, fields){
                                           if(err){
                                              if(config.debug){
                                                  req.app.get('global').fclog("Error Deleting : %s ",err);
                                                  res.json({error_code:1, error_msg:message.technical_error});
                                                  return false;
                                                }
                                           }
                                        });
                                       
                                        QUERY = "UPDATE  "+config_constant.GROUP+" SET group_name= "+"'"+data[0]['group_name']+"' WHERE id='"+data[0]['group_id']+"'"; 
                                        req.app.get('connection').query(QUERY, function(err, rows, result){
                                            if(err){
                                                if(config.debug){
                                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                                      res.json({error_code:1, error_msg:message.technical_error});
                                                      return false;
                                                    }
                                                }else{
                                                  for(var i=0;i<_.size(data);i++){
                                                  QUERY = "INSERT INTO "+config_constant.GROUPINFO+" SET class_id="+"'"+data[i]['class_id']+"'" +",group_id="+"'"+data[0]['group_id']+"'" +",student_no="+"'"+data[i]['student_no']+"'" +",created_at="+"'"+_global.js_yyyy_mm_dd()+"'" +", updated_at="+"'"+_global.js_yyyy_mm_dd()+"'";    
                                                  req.app.get('connection').query(QUERY, function(err, rows, result){
                                                    if(err){
                                                     if(config.debug){
                                                      req.app.get('global').fclog("Error Selecting : %s ",err);
                                                      res.json({error_code:1, error_msg:message.technical_error});
                                                      return false;
                                                    }
                                                }
                                              });                     
                                             }
                                           }
                                            output.timestamp = req.query.timestamp;
                                            output.status = message.success;
                                            output.comments = message.success;
                                            output.user_list = rows;
                                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo/update_access');
                                            res.json(output);                        
                                         });
                                         }
                                 });                              
                        },

                       /**
                       * Add group.
                       *
                       * @param req, res
                       * @return response
                       */
                     pointweight:function(req,res){
                         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'groupinfo/pointweight_access');
                         var data = [], output={};
                         var SET = "";
                         var input = JSON.parse(JSON.stringify(req.body));
                         if(typeof input.class_id != 'undefined'){
                               SET += " class_id=?, ";
                               data.push(input.class_id.trim());
                          }
                          if(typeof input.group_id != 'undefined'){
                               SET += " group_id=?, ";
                               data.push(input.group_id.trim());
                           }
                           
                          if(typeof input.pointweight != 'undefined'){
                               SET += " pointweight=?, ";
                               data.push(input.pointweight.trim());
                           } 
                           SET = SET.trim().substring(0, SET.trim().length-1);
                           QUERY = "SELECT * FROM "+config_constant.GROUP+" WHERE class_id='"+input.class_id+"' AND id='"+input.group_id+"'";
                           req.app.get('connection').query(QUERY, function(err, rows, fields){
                           var t =rows[0];
                           var point =t['pointweight']+ + +input.pointweight;
                           QUERY1 = "UPDATE "+config_constant.GROUP+"  SET pointweight="+point+" WHERE class_id='"+input.class_id+"'AND id ='"+input.group_id+"'";
                           req.app.get('connection').query(QUERY1, function(err, rows, fields){                        
                           QUERY2 = "SELECT student_no FROM "+config_constant.GROUPINFO+" WHERE class_id='"+input.class_id+"'AND group_id='"+input.group_id+"'";
                           req.app.get('connection').query(QUERY2, function(err, rows2, fields){
                           for(var i=0;i<_.size(rows2);i++){
                              QUERY3 = "UPDATE "+config_constant.STUDENTINFO+"  SET pointweight= `pointweight` + '"+input.pointweight+"', updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE student_no='"+rows2[i]['student_no']+"'";
                              req.app.get('connection').query(QUERY3, function(err, rows, fields){                                      
                                  if(err){
                                       if(config.debug){
                                              req.app.get('global').fclog("Error Updating : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                            }
                                          }
                                        });
                                        QUERY = "INSERT INTO "+config_constant.STUDENTINFO_POINT+" SET class_id='"+input.class_id+"', student_info_no='"+rows2[i]['student_no']+"', point='"+input.pointweight+"', customize_skills_id='"+input.customize_skills_id+"', created_at=" +" ' "+_global.js_yyyy_mm_dd()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" '"; 
                                        req.app.get('connection').query(QUERY, function(err, rows_student_info, fields){
                                        if(err){
                                            if(config.debug){
                                                  req.app.get('global').fclog("Error Inserting : %s ",err);
                                                  res.json({error_code:1, error_msg:message.technical_error});
                                                  return false;
                                                }
                                              }
                                            });
                                      }      
                               
                                  QUERY4= "UPDATE "+config_constant.CLASSINFO+"  SET pointweight= `pointweight` + '"+input.pointweight*_.size(rows2)+"', updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE class_id='"+input.class_id+"'";
                                  req.app.get('connection').query(QUERY4, function(err, rows, fields){                                        
                                     if(err){
                                        if(config.debug){
                                              req.app.get('global').fclog("Error Selecting : %s ",err);
                                              res.json({error_code:1, error_msg:message.technical_error});
                                              return false;
                                            }
                                         }
                                     });                   
                                  }); 
								               });               
                            });           
                               output.timestamp = req.query.timestamp;
                               output.status = message.success;
                               output.comments = message.success;
                               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'groupinfo/pointweight_access');
                               res.json(output);
                             }
                        }

