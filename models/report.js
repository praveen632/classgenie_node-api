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
var moment = require('moment-timezone');
module.exports = {
	   /**
       * All the request of student report with GET method.
       *
       * @param req, res
       * @return response
       */
	   studentReportList: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/student_access');
           var data = [], output={}, customize_skills_id = '', name = [], id = '', student_info_no = '';
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
               var arr = input.class_id.split(",");               
               class_id = [];
                _.each(arr, function(item){
                     class_id += ','+"'"+item+"'";
                    });               
               if(class_id != ''){
                    class_id = class_id.substring(1);
                }             
              if(typeof input.student_info_no != 'undefined'){
              	SET += " student_info_no=?, ";
              	data.push(input.student_info_no.trim());
              }
			
            SET = SET.trim().substring(0, SET.trim().length-1);      
            QUERY = "SELECT remark, created_at FROM "+config_constant.TEACHERSTUDENTREMARK+" where student_no = '"+input.student_info_no+"' ";			
			      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }
                  output.remark=rows;                                       
            });
               // calculate according to date range  
                if(input.datetoken == "today"){
                     var startdate = moment().format('YYYY-MM-DD');
                 var enddate   = moment().add(1, 'day').format('YYYY-MM-DD');
                 }else if(input.datetoken == "thisweek"){
                          var startdate = moment().startOf('week').format('YYYY-MM-DD');
                          var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                       }else if(input.datetoken == "thismonth"){
                          var date = new Date();
                          var enddate = moment().format('YYYY-MM-DD');
                          var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                          var startdate = moment(firstDay).format('YYYY-MM-DD');
						  }else if(input.datetoken == "daterange"){
                     var startdate = input.startdate;
                     var enddate = input.enddate;   
                 }
          // Query according to time period    
           QUERY = "SELECT created_at, student_info_no, customize_skills_id, class_id, sum(point) as point FROM "+config_constant.STUDENTINFO_POINT+" WHERE student_info_no = '"+input.student_info_no+"' and created_at BETWEEN '"+startdate+"' AND '"+enddate+"' GROUP BY customize_skills_id ";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
               	if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
               }
              if(_.size(rows) > 0){
                point = {};
               	output.point = []; 
                _.each(rows, function(item){
               	output.point.push(item);
                customize_skills_id += ','+item.customize_skills_id;
               }); 
                if(customize_skills_id != ''){
                	customize_skills_id = customize_skills_id.substring(1);
                }
                //select teacher_ac_no from class info. 
                 QUERY = "SELECT teacher_ac_no, class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                             if(err){
                               if(config.debug){
                                    req.app.get('global').fclog("Error Selecting : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                             }                  
                             //result = rows[0];
                             name_node = [], member_no = [];
                             _.each(rows, function(item){
                               name_node[item.class_id] = item;
                               member_no += ","+"'"+item.teacher_ac_no+"'";
                             });

                             if(member_no != ''){
                              member_no = member_no.substring(1);
                             }

                            teacher_name = {};
                             QUERY1 = "SELECT name, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") and status > '-1'";
                             
                             req.app.get('connection').query(QUERY1, data, function(err, rows2, fields){
                               _.each(rows2, function(item){
                                  teacher_name[item.member_no] = item.name;
                               });
                              //Select all data from customize skill table by customize_skills_id.  
                               var item_node = {};
                               QUERY = " SELECT name, id, pointweight, image FROM "+config_constant.EDITSKILLS+" where id IN ("+customize_skills_id+")";
                                   req.app.get('connection').query(QUERY, function(err, rows, fields){
                                       _.each(rows, function(item, index){
                                         item_node[item.id] = item;                     
                                       });
                                            _.each(output.point, function(item, index){
                                          	if(typeof item_node[item.customize_skills_id] != 'undefined'){
                                             output.point[index]['customize_detail'] = item_node[item.customize_skills_id];
                                            }
                                         });
                                        //select student name from student info table.
                                        student_node = {};
                                        QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" WHERE student_no ='"+input.student_info_no+"' ";
                                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){                  
                                           _.each(rows, function(item, index){
                                            student_node[item.student_no] = item.name;                      
                                           });                   
                                           _.each(output.point, function(item, index){                    
                                               if(typeof student_node[item.student_info_no] != 'undefined'){
                                                 output.point[index]['student_name'] = student_node[item.student_info_no];
                                                 output.point[index]['class_name'] = name_node[item.class_id];  
                                    
                                                 output.point[index]['class_name']['teacher_name'] = teacher_name[name_node[item.class_id]['teacher_ac_no']];
                                                }
                                           });
                            							  output.timestamp = req.query.timestamp;
                            							  output.status = message.success;
                            							  output.comments = message.success;
                                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/student_access');
                                            res.json(output);
                                           });
                                      });
                                 });
                               });
               }else{
                res.json({'status':message.failure, 'comments':message.noresult});
               }
             });
          },
      
      /**
       * All student report.
       *
       * @param req, res
       * @return response
       */
      allReportList: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/student_access');
           var data = [], output={}, customize_skills_id = '', name = [], id = '', student_info_no = '';
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
           
            if(typeof input.parent_ac_no != 'undefined'){
              SET += " parent_ac_no=?, ";
              data.push(input.parent_ac_no.trim());
            } 
            if(typeof input.name != 'undefined'){
              SET += " name=?, ";
              data.push(input.name.trim());
            }    
            SET = SET.trim().substring(0, SET.trim().length-1);      
            // calculate according to date range
            if(input.datetoken == "today"){
                 var startdate = moment().format('YYYY-MM-DD');
             var enddate   = moment().add(1, 'day').format('YYYY-MM-DD');
             }else if(input.datetoken == "thisweek"){
                      var startdate = moment().startOf('week').format('YYYY-MM-DD');
                      var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                   }else if(input.datetoken == "thismonth"){
                      var date = new Date();
                      var enddate = moment().format('YYYY-MM-DD');
                      var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                      var startdate = moment(firstDay).format('YYYY-MM-DD');
             }else if(input.datetoken == "daterange"){
                 var startdate = input.startdate;
                 var enddate = input.enddate;   
             }
                
            QUERY = "SELECT student_no, class_id FROM "+config_constant.STUDENTINFO+" where parent_ac_no = '"+input.parent_ac_no+"' AND name = BINARY '"+input.name+"' ";      
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Selecting10 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }
                     
                    student_no = [], class_id = [];
                    _.each(rows, function(item){
                        student_no += ','+"'"+item.student_no+"'";
                        class_id += ','+"'"+item.class_id+"'";
                    });
                    if(student_no != ''){
                      student_no = student_no.substring(1);
                    }
                    if(class_id != ''){
                      class_id = class_id.substring(1);
                    }
                    // Query according to time period    
                    QUERY = "SELECT created_at, student_info_no, customize_skills_id, class_id, sum(point) as point FROM "+config_constant.STUDENTINFO_POINT+" WHERE student_info_no IN ("+student_no+") and created_at BETWEEN '"+startdate+"' AND '"+enddate+"' GROUP BY customize_skills_id ";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                        if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                       }
                      if(_.size(rows) > 0){
                        point = {};
                        output.point = []; 
                        _.each(rows, function(item){
                        output.point.push(item);
                        customize_skills_id += ','+item.customize_skills_id;
                       }); 
                        if(customize_skills_id != ''){
                          customize_skills_id = customize_skills_id.substring(1);
                        }
                        //select teacher_ac_no from class info. 
                        QUERY = "SELECT teacher_ac_no, class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                             if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                           }                  
                           //result = rows[0];
                           name_node = [], member_no = [];
                           _.each(rows, function(item){
                             name_node[item.class_id] = item;
                             member_no += ","+"'"+item.teacher_ac_no+"'";
                           });

                           if(member_no != ''){
                            member_no = member_no.substring(1);
                           }

                          teacher_name = {};
                           QUERY1 = "SELECT name, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") and status > '-1'";
                           
                           req.app.get('connection').query(QUERY1, data, function(err, rows2, fields){
                             _.each(rows2, function(item){
                                teacher_name[item.member_no] = item.name;
                             });
                        //Select all data from customize skill table by customize_skills_id.  
                         var item_node = {};
                         QUERY = " SELECT name, id, pointweight, image FROM "+config_constant.EDITSKILLS+" where id IN ("+customize_skills_id+")";
                             req.app.get('connection').query(QUERY, function(err, rows, fields){
                                 _.each(rows, function(item, index){
                                   item_node[item.id] = item;                     
                                 });
                                      _.each(output.point, function(item, index){
                                      if(typeof item_node[item.customize_skills_id] != 'undefined'){
                                       output.point[index]['customize_detail'] = item_node[item.customize_skills_id];

                                       output.point[index]['class_name'] = name_node[item.class_id];  
                      
                                       output.point[index]['class_name']['teacher_name'] = teacher_name[name_node[item.class_id]['teacher_ac_no']];
                                      }
                                   });
                                   //select student name from student info table.
                                  student_node = {};
                                  QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" WHERE student_no IN ("+student_no+") ";
                                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){                  
                                     _.each(rows, function(item, index){
                                      student_node[item.student_no] = item.name;                      
                                     });                   
                                     _.each(output.point, function(item, index){                    
                                         if(typeof student_node[item.student_info_no] != 'undefined'){
                                           output.point[index]['student_name'] = student_node[item.student_info_no];
                                          }
                                     });
                                      output.timestamp = req.query.timestamp;
                                      output.status = message.success;
                                      output.comments = message.success;
                                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/student_access');
                                      res.json(output);
                                     });
                                });
                               });
                           });
                        }else{
                          res.json({'status':message.failure, 'comments':message.noresult});
                       }
                     });
                   });
               // });
            },
       /**
       * All the request of class report with GET method.
       *
       * @param req, res
       * @return response
       */
      classReportList: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/class_access');
           var data = [], output={}, customize_skills_id = '', student_info_no = '', name = [], id = '';
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
            if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
            }
            if(input.datetoken == "today"){
               var startdate = moment().format('YYYY-MM-DD');
               var enddate   = moment().add(1, 'day').format('YYYY-MM-DD');
           }else if(input.datetoken == "thisweek"){
                    var startdate = moment().startOf('week').format('YYYY-MM-DD');
                    var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                 }else if(input.datetoken == "thismonth"){
                    var date = new Date();
                    var enddate = moment().format('YYYY-MM-DD');
                    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    var startdate = moment(firstDay).format('YYYY-MM-DD');
                 }else if(input.datetoken == "daterange"){
               var startdate = input.startdate;
               var enddate = input.enddate;   
           }
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "SELECT created_at, student_info_no, customize_skills_id, sum(point) as point FROM "+config_constant.STUDENTINFO_POINT+" WHERE class_id = '"+input.class_id+"' and created_at BETWEEN "+startdate+" AND "+enddate+" GROUP BY customize_skills_id ";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
               if(_.size(rows) > 0){
                output.point = [];
                point = {};
                _.each(rows, function(item){
                   output.point.push(item);
                   customize_skills_id += ','+item.customize_skills_id;
                   student_info_no += ','+"'"+item.student_info_no+"'";
                });
                if(customize_skills_id != '' && student_info_no != ''){
                  customize_skills_id = customize_skills_id.substring(1);
                  student_info_no = student_info_no.substring(1);
                }                
                //select teacher_ac_no from class info. 
                QUERY = "SELECT teacher_ac_no FROM "+config_constant.CLASSINFO+" WHERE class_id = '"+input.class_id+"' ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }                  
                   result = rows[0];
                   QUERY1 = "SELECT name FROM "+config_constant.EDUSER+" WHERE member_no = "+result['teacher_ac_no']+" ";
                   req.app.get('connection').query(QUERY1, data, function(err, rows1, fields){
                       if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                       }
                     output.teacher_name=rows1;                    
                   });       
                //Select all data from customize skill table by customize_skills_id. 
                item_node = {};
                QUERY = "SELECT name, id, pointweight, image FROM "+config_constant.EDITSKILLS+" WHERE id IN ("+customize_skills_id+") ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   _.each(rows, function(item, index){
                      item_node[item.id] = item;
                   });
                   _.each(output.point, function(item, index){
                       if(typeof item_node[item.customize_skills_id] != 'undefined'){
                         output.point[index]['customize_detail'] = item_node[item.customize_skills_id];
                        }
                   });

                //select student name from student info table.
                student_node = {};
                QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" WHERE student_no IN ("+student_info_no+") ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){                  
                   _.each(rows, function(item, index){
                    student_node[item.student_no] = item.name;                      
                   });                   
                   _.each(output.point, function(item, index){                    
                       if(typeof student_node[item.student_info_no] != 'undefined'){
                         output.point[index]['student_name'] = student_node[item.student_info_no];
                        }
                   });
				             output.status = message.success;
                     output.comments = message.success;
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/class_access');
                     res.json(output);
                   });
                });
              });
              }else{
                 res.json({'status':message.failure, 'comments':message.noresult});
              }
            });   
      },
      /**
       * Add remarks with POST method.
       *
       * @param req, res
       * @return response
       */
       addRemark: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/addremark_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
            if(typeof input.student_no != 'undefined'){
                 SET += " student_no=?, ";
                 data.push(input.student_no.trim());
            }
            if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
            }
            if(typeof input.teacher_ac_no != 'undefined'){
                 SET += " teacher_ac_no=?, ";
                 data.push(input.teacher_ac_no.trim());
            }
            if(typeof input.remark != 'undefined'){
                 SET += " remark=?, ";
                 data.push(input.remark.trim());
            }
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "INSERT INTO "+config_constant.TEACHERSTUDENTREMARK+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' ";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
              if(config.debug){
                  req.app.get('global').fclog("Error Inserting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
              QUERY = "SELECT * FROM "+config_constant.TEACHERSTUDENTREMARK+" WHERE id = '"+rows.insertId+"' ";
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
                  output.like_list = rows;
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/addremark_access');
                  res.json(output);
                }
              })
            }
          });
       },
       /**
       * Remove report with POST method.
       *
       * @param req, res
       * @return response
       */
       removeReport: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/addremark_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
            if(typeof input.student_info_no != 'undefined'){
                 SET += " student_info_no=?, ";
                 data.push(input.student_info_no.trim());
            }
            if(typeof input.customize_skills_id != 'undefined'){
                 SET += " customize_skills_id=?, ";
                 data.push(input.customize_skills_id.trim());
            }
            if(typeof input.point != 'undefined'){
                 SET += " point=?, ";
                 data.push(input.point.trim());
            }
            if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
            }
            SET = SET.trim().substring(0, SET.trim().length-1);
            QUERY = "DELETE FROM "+config_constant.STUDENTINFO_POINT+" WHERE student_info_no = '"+input.student_info_no+"' AND customize_skills_id = '"+input.customize_skills_id+"' limit 1";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error Deleting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
              }else{
                QUERY = "SELECT pointweight FROM "+config_constant.STUDENTINFO+" WHERE student_no = '"+input.student_info_no+"' ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                   }else{
                   result = rows[0];
                   var pointweight = result['pointweight'];
                   pointweight1 = +pointweight - +input.point;
                   QUERY1 = "UPDATE "+config_constant.STUDENTINFO+" SET pointweight= "+pointweight1+", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE student_no='"+input.student_info_no+"'";
                   req.app.get('connection').query(QUERY1, data, function(err, rows, fields){
                     if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                     }else{
                      QUERY = "SELECT pointweight FROM "+config_constant.CLASSINFO+" WHERE class_id = '"+input.class_id+"' ";
                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                         if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                       }
                        result = rows[0];
                        var pointweight2 = result['pointweight'];
                        pointweight3 = +pointweight2 - +input.point;
                        QUERY1 = "UPDATE "+config_constant.CLASSINFO+" SET pointweight= "+pointweight3+", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE class_id='"+input.class_id+"'";
                        req.app.get('connection').query(QUERY1, data, function(err, rows, fields){
                           if(err){
                             if(config.debug){
                                  req.app.get('global').fclog("Error Updating : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                           }else{
                            output.timestamp = req.query.timestamp;
                            output.status = message.success;
                            output.comments = message.success;
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/addremark_access');
                            res.json(output);
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
       * Remove report with POST method.
       *
       * @param req, res
       * @return response
       */
       removeRemark: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/remove/remark_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));           
            if(typeof input.student_info_no != 'undefined'){
                 SET += " student_info_no=?, ";
                 data.push(input.student_info_no.trim());
            }
            QUERY = "DELETE FROM "+config_constant.TEACHERSTUDENTREMARK+" WHERE student_no = '"+input.student_info_no+"' limit 1";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error Deleting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
              }else{
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/remove/remark_access');
                res.json(output);
              }
            });
          },
          /**
         * Student class story list.
         *
         * @param req, res
         * @return response
         */
          studentClassReportList: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/class_access');
              var data = [], output={}, customize_skills_id = '', student_info_no = '', teacher_ac_no = [];
              var SET = "";
              var input = JSON.parse(JSON.stringify(req.body));         
              if(typeof input.student_ac_no != 'undefined'){
                 SET += " student_ac_no=?, ";
                 data.push(input.student_ac_no.trim());
             }
               if(input.datetoken == "today"){
                     var startdate = moment().format('YYYY-MM-DD');
                     var enddate   = moment().add(1, 'day').format('YYYY-MM-DD');
                 }else if(input.datetoken == "thisweek"){
                          var startdate = moment().startOf('week').format('YYYY-MM-DD');
                          var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                       }else if(input.datetoken == "thismonth"){
                          var date = new Date();
                          var enddate = moment().format('YYYY-MM-DD');
                          var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                          var startdate = moment(firstDay).format('YYYY-MM-DD');
                       }else if(input.datetoken == "daterange"){
						               var startdate = input.startdate;
                           var enddate = input.enddate;   
                      }
                         
        			       SET = SET.trim().substring(0, SET.trim().length-1);
                     QUERY = "SELECT student_info_id FROM "+config_constant.USERSTUDENTINFO+" WHERE student_ac_no = '"+input.student_ac_no+"' ";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                          if(config.debug){
        					              req.app.get('global').fclog("Error Selecting1 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                            }
                         }
        				          else if(_.size(rows)<0){
                             res.json({'status':message.failure, 'comments':message.nodata});
                          }
                         else
                         { 
                         var id = [];
        			           if(_.size(rows) > 0){
                         _.each(rows, function(item){
                          id += ','+item.student_info_id;
                         });
                         if(id != ''){
                          id = id.substring(1);
                         }
                        QUERY = "SELECT class_id, student_no FROM "+config_constant.STUDENTINFO+" WHERE id IN ("+id+") ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                            if(config.debug){
        						             req.app.get('global').fclog("Error Selecting2 : %s ",err);
                                 res.json({error_code:1, error_msg:message.technical_error});
                                 return false;
                              }
                           }
                           var class_id = [], student_info_no = [];
                           _.each(rows, function(item){
                            class_id += ','+"'"+item.class_id+"'";
                            student_info_no += ','+"'"+item.student_no+"'";
                           });
                           if(class_id != ''){
                            class_id = class_id.substring(1);
                           }
                           if(student_info_no != ''){
                            student_info_no = student_info_no.substring(1);
                           }	
                           QUERY = "SELECT created_at, class_id, student_info_no, customize_skills_id, sum(point) as point FROM "+config_constant.STUDENTINFO_POINT+" WHERE class_id IN ("+class_id+") and student_info_no IN ("+student_info_no+") AND created_at BETWEEN '"+startdate+"' AND '"+enddate+"' GROUP BY customize_skills_id";
                           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                              if(err){
                                 if(config.debug){
                                    req.app.get('global').fclog("Error Selecting3 : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                              }
                              if(_.size(rows) > 0){
                                   output.point = [];
                                   point = {};
                                   var customize_skills_id = [], student_info_no = [];
                                  _.each(rows, function(item){
                                     output.point.push(item);
                                     customize_skills_id += ','+item.customize_skills_id;
                                     student_info_no += ','+"'"+item.student_info_no+"'";
                                  });
                                  if(customize_skills_id != '' && student_info_no != ''){
                                    customize_skills_id = customize_skills_id.substring(1);
                                    student_info_no = student_info_no.substring(1);
                                  }
                                              
                                  //select teacher_ac_no from class info. 
                                  QUERY = "SELECT teacher_ac_no, class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                     if(err){
                                       if(config.debug){
                                            req.app.get('global').fclog("Error Selecting4 : %s ",err);
                                            res.json({error_code:1, error_msg:message.technical_error});
                                            return false;
                                          }
                                     }                  
                                     //result = rows[0];
                                     name_node = [], member_no = [];
                                     _.each(rows, function(item){
                                       name_node[item.class_id] = item;
                                       member_no += ","+"'"+item.teacher_ac_no+"'";
                                     });

                                     if(member_no != ''){
                                      member_no = member_no.substring(1);
                                     }
                                    teacher_name = {};
                                     QUERY1 = "SELECT name, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") and status > '-1'";
                                     req.app.get('connection').query(QUERY1, data, function(err, rows2, fields){
                                       _.each(rows2, function(item){
                                          teacher_name[item.member_no] = item.name;
                                       });                                                                 
                                         
                                  //Select all data from customize skill table by customize_skills_id. 
                                  item_node = {};
                                  QUERY = "SELECT name, id, pointweight, image FROM "+config_constant.EDITSKILLS+" WHERE id IN ("+customize_skills_id+") ";
                                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                     _.each(rows, function(item, index){
                                        item_node[item.id] = item;
                                     });

                                     _.each(output.point, function(item, index){
                                         if(typeof item_node[item.customize_skills_id] != 'undefined'){
                                             output.point[index]['customize_detail'] = item_node[item.customize_skills_id];
                                             output.point[index]['class_name'] = name_node[item.class_id];  
                                             output.point[index]['class_name']['teacher_name'] = teacher_name[name_node[item.class_id]['teacher_ac_no']];
                                          }
                                     });
                                  
                                  //select student name from student info table.
                                  student_node = {};
                                  QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" WHERE student_no IN ("+student_info_no+") ";
                                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){                  
                                     _.each(rows, function(item, index){
                                      student_node[item.student_no] = item.name;                      
                                     });                   
                                     _.each(output.point, function(item, index){                    
                                         if(typeof student_node[item.student_info_no] != 'undefined'){
                                           output.point[index]['student_name'] = student_node[item.student_info_no];
                                          }
                                     });
                      							  output.timestamp = req.query.timestamp;
                      							  output.status = message.success;
                      							  output.comments = message.success;
                                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/class_access');
                                      res.json(output);
                                     });
                                  });
                                });
                                });   
                                }else{
                                   res.json({'status':message.failure, 'comments':message.noresult});
                                }
                              });        					  
                        });
        				}else{
        					  res.json({'status':message.failure, 'comments':message.noresult});
    					  }
            }	
         });               		 
      }
    }