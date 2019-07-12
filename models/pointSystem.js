var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var validator = require("email-validator");
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      studentPointList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'points/student_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? AND status > '0'";
                   data.push(query_str.class_id.trim());
               }
               QUERY = "SELECT * FROM "+config_constant.EDITSKILLS+" "+where+" ORDER BY class_id "+sort_by+" "+limit+" ";
              
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
                var needwork = [];
                var user_list1 = [];
                for(i=0 ; i< rows.length ; i++)
                {  
                   if(rows[i]['pointweight'] < 0)
                   {
                     needwork.push(rows[i]);
                   }
                    if (rows[i]['pointweight'] > 0)
                    {
                      user_list1.push(rows[i]);
                    }
                }
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                output.user_list = user_list1;
                output.needwork = needwork;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'points/student_access');
                res.json(output);
          });
      },

      /**
       * All the request of user with put Method 
       *
       * @param req, res
       * @return response
       */
      updateStudentPoint: function (req, res){

           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'points/student/update_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
        
           if(typeof input.id != 'undefined'){
                 SET += " id=?, ";
                 data.push(input.id.trim());
            }
            if(typeof input.pointweight != 'undefined'){
                 SET += " pointweight=?, ";
                 data.push(input.pointweight.trim());
             }
             if(typeof input.class_id != 'undefined'){
                 SET += " class_id=?, ";
                 data.push(input.class_id.trim());
             }
             if(typeof input.student_no != 'undefined'){
             SET += " student_no=?, ";
             data.push(input.student_no.trim());
             }
            if(typeof input.customize_skills_id != 'undefined'){
             SET += " customize_skills_id=?, ";
             data.push(input.customize_skills_id.trim());
            }
            // select pointweight from studentinfo
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT pointweight FROM "+config_constant.STUDENTINFO+" WHERE student_no ='"+input.student_no+"'";
             
             
             req.app.get('connection').query(QUERY, [input.id], function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }else{
                  // select pointweight from studentinfo        
                  result = rows[0];
                  var pointweight_result = result['pointweight'];                 
                  pointweight = +pointweight_result + +input.pointweight;
                  QUERY1 = "SELECT pointweight FROM "+config_constant.CLASSINFO+" WHERE class_id = ?";
                  req.app.get('connection').query(QUERY1, [input.class_id], function(err, rows, fields){
                    if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                       }
                   }else{
                    // insert query for ed_studentinfo_point
                    QUERY = "INSERT INTO "+config_constant.STUDENTINFO_POINT+" SET class_id='"+input.class_id+"', student_info_no='"+input.student_no+"', point='"+input.pointweight+"', customize_skills_id='"+input.customize_skills_id+"', created_at=" +" ' "+_global.js_yyyy_mm_dd()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" '"; 
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                      if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Inserting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }
                  });
                
                  //update point weight for single student
                  result = rows[0];
                  var pointweight_result1 = result['pointweight'];
                  pointweight1 = +pointweight_result1 + +input.pointweight;
                  QUERY3 = "UPDATE "+config_constant.STUDENTINFO+" SET pointweight= "+pointweight+", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE student_no ='"+input.student_no+"'";
                  req.app.get('connection').query(QUERY3, data, function(err, rows, fields){
                   if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                   }else{
                       QUERY4 = "UPDATE "+config_constant.CLASSINFO+" SET pointweight= "+pointweight1+", created_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE class_id='"+input.class_id+"'";
                       req.app.get('connection').query(QUERY4, data, function(err, rows, fields){
                       if(err){
                           if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{
                             QUERY = " SELECT * FROM "+config_constant.STUDENTINFO+" WHERE student_no ='"+input.student_no+"'";
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
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'points/student_access');
                                  res.json(output);
                                }
                             }); // end 5
                            }
                           }); // end 4
                        }
                    }); // end 3
                 }
              }); // end 2
            }
        }); // end 1
      },

     /**
     * Display listing of resources.
     *
     * @param req, res
     * @return response
     */
    classPointList: function (req, res){
            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'points/class_access');
            var query_str = url.parse(req.url,true).query;
            var data = [], output={};
            var where = " WHERE 1=1 ";
            var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
            var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
            if(typeof query_str.class_id != 'undefined'){
                 where += " AND class_id=? AND status > '0'";
                 data.push(query_str.class_id.trim());
             }                     
             QUERY = "SELECT * FROM "+config_constant.EDITSKILLS+" "+where+" ORDER BY class_id "+sort_by+" "+limit+" ";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
              }
              var needwork = [];
              var user_list1 = [];
              for(i=0 ; i< rows.length ; i++)
              {  
                 if(rows[i]['pointweight'] < 0)
                 {
                   needwork.push(rows[i]);                  
                 }
                  if (rows[i]['pointweight'] > 0)
                  {
                    user_list1.push(rows[i]);
                  }
              }
              output.timestamp = req.query.timestamp;
              output.status = message.success;
              output.comments = message.success;
              output.user_list = user_list1;
              output.needwork = needwork;
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'points/class_access');
              res.json(output);
        });
    },

   /**
   * All the request of user with put Method 
   *
   * @param req, res
   * @return response
   */
   updateClassPoint: function (req, res){
       mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'points/class/update_access');
       var data = [], output={};
       var SET = "";
       var input = JSON.parse(JSON.stringify(req.body));
       if(typeof input.id != 'undefined'){
             SET += " id=?, ";
             data.push(input.id.trim());
        }
        if(typeof input.pointweight != 'undefined'){
             SET += " pointweight=?, ";
             data.push(input.pointweight.trim());
         }
         if(typeof input.class_id != 'undefined'){
             SET += " class_id=?, ";
             data.push(input.class_id.trim());
         }
         if(typeof input.custamise_skill_id != 'undefined'){
             SET += " custamise_skill_id=?, ";
             data.push(input.custamise_skill_id.trim());
         }        
         SET = SET.trim().substring(0, SET.trim().length-1);
         QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE class_id = ?";
         req.app.get('connection').query(QUERY, [input.class_id], function(err, rows, fields){
          if(err){
              if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
              //update point weight student info
              count = _.size(rows);
              point = count * input.pointweight;
              for(var i=0; i<count; i++){
                var result=0;
                var test =rows[i];
                var id=rows[i];
                result = +test['pointweight'] + +input.pointweight;
                var classId =id['id']; 
                QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET pointweight= "+result+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id='"+input.class_id+"' AND id='"+classId+"'";
                req.app.get('connection').query(QUERY, function(err, rows, fields){
                if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error updating : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                  }
                });

                // insert query for ed_studentinfo_point
                result = rows[i];
                student_no = result['student_no'];
                QUERY = "INSERT INTO "+config_constant.STUDENTINFO_POINT+" SET class_id='"+input.class_id+"', student_info_no='"+student_no+"', point='"+input.pointweight+"', customize_skills_id='"+input.customize_skills_id+"', created_at=" +" ' "+_global.js_yyyy_mm_dd()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" '"; 
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Inserting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                  }
                });
               }

               // update point weight for classinfo
                QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" WHERE class_id = ?";
                req.app.get('connection').query(QUERY, [input.class_id], function(err, rows, fields){
                if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                }else{
                  result = rows[0];
                  var pointweight_result = result['pointweight'];
                  pointweight = +pointweight_result + +point;
                  QUERY = "UPDATE "+config_constant.CLASSINFO+" SET pointweight= "+pointweight+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id='"+input.class_id+"'";
                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                  if(err){
                     if(config.debug){
                          req.app.get('global').fclog("Error Updating : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                  }else{
                  QUERY = " SELECT * FROM "+config_constant.CLASSINFO+" WHERE class_id ='"+input.class_id+"'";
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
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'points/class/update_access');
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
     }