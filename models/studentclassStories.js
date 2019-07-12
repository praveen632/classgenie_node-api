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
          listClassStories:function(req, res){
                     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'studentclassstories/list_allPost');
                     var data = [], output={}, comment_detail=[], story_id='', member_no='' ;
                     var SET = "";
                     var teacher_name = "";
                     var input = JSON.parse(JSON.stringify(req.body));
                     if(typeof input.class_id != 'undefined'){
                           SET += " class_id=? ";
                           data.push(input.class_id.trim());
                      }
                    // Select class id   
                      QUERY = " SELECT *, SUBSTR(image,LOCATE('.',image)+1) as ext FROM "+config_constant.CLASSSTORIES+" where class_id ='"+input.class_id+"' and student_no='"+input.student_no+"'";
                      req.app.get('connection').query(QUERY, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                       if(_.size(rows) > 0 ){
                       // select story_id from classstory
                       output.posts = [];
                       _.each(rows, function(obj){
                        output.posts.push(obj);
                        story_id += ','+obj.id;
                      });
                        if(story_id != ''){
                             story_id = story_id.substring(1);
                         }                      
                         QUERY = "SELECT name FROM "+config_constant.EDUSER+" where member_no ='"+input.member_no+"' and status > '-1'";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                          if(err){
                              if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                            }
                              output.teacher_name=(rows);
                      });
                     // select class name
                     QUERY = " SELECT class_name FROM "+config_constant.CLASSINFO+" where class_id ='"+input.class_id+"'";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                          output.class_name=(rows);
                      });

                     // select student name
                     QUERY = " SELECT name FROM "+config_constant.STUDENTINFO+" where student_no ='"+input.student_no+"'";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }
                       output.student_name=(rows);
                      });                      
                     // select comment by story id
                        QUERY = " SELECT * FROM "+config_constant.CLASSCOMMENT+" where class_id ='"+input.class_id+"' and story_id IN ("+story_id+") order by story_id";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                            res.json({'status':message.failure, 'comments':"No Post Available"});
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                        var comment_list = {}, member_no='';
                        _.each(rows, function(obj){
                           member_no += ','+obj.member_no;
                         });
                        if(member_no != ''){
                           member_no = member_no.substring(1);
                         }
                         var story_detail = {};
                         _.each(rows, function(item){
                               if(typeof story_detail[item.story_id] == "undefined") {
                                  story_detail[item.story_id] = [];  
                               }
                              story_detail[item.story_id].push(item);
                          });

                         QUERY = "SELECT sum(status) as status, story_id, member_no FROM "+config_constant.CLASS_STORYLIKE+" where story_id IN ("+story_id+") GROUP BY story_id, member_no";
                         req.app.get('connection').query(QUERY, function(err, rows1, fields){
                         if(err){
                            res.json({'status':message.failure, 'comments':"No Post Available"});
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                          
                         var story_status = {};
                         _.each(rows1, function(item){
                               if(typeof story_status[item.story_id] == "undefined") {
                                  story_status[item.story_id] = [];  
                               }
                              story_status[item.story_id].push(item);
                           });                        

                        // coments detail with comments count
                         _.each(output.posts, function(item, index){
                               output.posts[index]['comment_detail'] = story_detail[item.id];
                               output.posts[index]['comment_count'] = _.size(output.posts[index]['comment_detail']);
                               output.posts[index]['status'] = story_status[item.id];
                             });
                             output.status = message.success;
                             output.comments = message.success;
                             res.json(output);
                      });
                     });
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentclassstories/list_allPost');
                      }else{
                        output.status = message.failure;
                        output.comments = message.nodata;
                        res.json(output);
                      }
                    });
                 },
               }