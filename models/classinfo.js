var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var encryption = require('../common/encryption');
var redis = require("redis");
var md5 = require("js-md5");
var config = require('../common/config');
var connection = require('../common/connection');
var path = require('path');
var fs = require('fs');
var parse = require('csv-parse');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      imageList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classinfo_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              client = redis.createClient(config.cache_port, config.cache_server);
              client.auth(config.cache_password);
               if(config.cache){
                    Key = 'CLASSIMG_'+md5("SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 1 AND status = '1' ");
                    client.get(Key, function(err, data) {
                         if(err || data === null) {
                             QUERY = "SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 1 AND status = '1' ";
                             connection.query(QUERY, data, function(err, rows, fields){
                               if(err){
                                    if(config.debug){
                                        req.app.get('global').fclog("Error Selecting : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                }
                                client.set(Key, serialize.serialize(rows));      
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                output.user_list = rows;
                                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo_access');
                                res.json(output);
                             });
                         }else{
                             rowdata = serialize.unserialize(data);
                             output.timestamp = req.query.timestamp;
                             output.status = message.success;
                             output.comments = message.success;
                             output.user_list = rowdata;
                             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo_access');
                             res.json(output);
                         }
                    });
               }else{
                 QUERY = "SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 1 AND status = '1' ";
                 connection.query(QUERY, data, function(err, rows, fields){
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
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo_access');
                  res.json(output);
                 });
           }
  },

  /**
   * All the request of user with GET method and execute in search operation.
   *
   * @param req, res
   * @return response
   */
  searchClassinfo: function (req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classinfo/search_access');
         var query_str = url.parse(req.url,true).query;
         var data = [], output={};
         var where = " WHERE 1=1 ";
         if(typeof query_str.member_no != 'undefined'){
             where += " AND member_no like ? ";
             data.push(query_str.member_no.trim()+"%");
         }
         if(typeof query_str.name != 'undefined'){
             where += " AND name like ? ";
             data.push(query_str.name.trim()+"%");
          }
         if(typeof query_str.email != 'undefined'){
             where += " AND email like ? ";
             data.push(query_str.email.trim()+"%");
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
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo/search_access');
           res.json(output);
      });
  },

  /**
   * Display listing of resources.
   *
   * @param req, res
   * @return response
   */
  dashboardUsers: function (req, res){
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classinfo/dashboard_access');
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var where = " WHERE 1=1 ";
          var page_size = req.app.get('config').page_size;
          var start_record_index = (query_str.page_number-1)*page_size;              
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index>-1 && page_size != '') ? " LIMIT "+start_record_index+" ,"+page_size:" LIMIT 0,"+req.app.get('config').page_size;
          var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " desc ":" asc ");
          QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where teacher_ac_no="+query_str.teacher_ac_no+" ORDER BY class_name "+sort_by+" ";
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
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo/dashboard_access');
           res.json(output);
      });
  },

  /**
   * Display listing of resources.
   *
   * @param req, res
   * @return response
   */
  studentlistUsers: function (req, res){
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classinfo/studentlist_access');
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var target = {};
          var student_list="";
          var where = " WHERE 1=1 ";
          var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
          var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
          if(typeof query_str.class_id != 'undefined'){
               where += " AND class_id=? ";
               data.push(query_str.class_id.trim());
           }
           QUERY = "SELECT class_name, image, grade, pointweight, class_id FROM "+config_constant.CLASSINFO+" "+where+" ";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
           if(err){
             if(config.debug){
                req.app.get('global').fclog("Error Selecting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
           }
           QUERY = "SELECT id, name, image, parent_no, pointweight,student_no, request_status FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY name asc ";
           req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
           if(err){
             if(config.debug){
                req.app.get('global').fclog("Error Selecting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
           }else{                
             output.status = message.success; 
             output.comments = message.success;
             output.class_details = rows[0];
             output.class_details.student_list = rows1;
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo/studentlist_access');
             res.json(output);
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

 addClassinfo: function (req, res){
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classinfo_access');
      var data = [], output={};
      var SET = "";
      var input = JSON.parse(JSON.stringify(req.body));
      if(typeof input.class_name != 'undefined'){
        SET += " class_name=?, ";
        data.push(input.class_name.trim());
      }
      if(typeof input.grade != 'undefined'){
        SET += " grade=?, ";
        data.push(input.grade.trim());
      }
      if(typeof input.image != 'undefined'){
        SET += " image=?, ";
        data.push(input.image.trim());
      }
      if(typeof input.teacher_ac_no != 'undefined'){
        SET += " teacher_ac_no=? ";
        data.push(input.teacher_ac_no.trim());
      }
   
        // multiple case for validate school and demo class
       if(typeof input.school_id != 'undefined' && input.school_id != '0'){
        // when school is selected
        QUERY = "SELECT status FROM "+config_constant.SCHOOLS+" where school_id = '"+input.school_id+"'";
            req.app.get('connection').query(QUERY, function(err, rows, fields){
            if(err){
              if(config.debug){
                req.app.get('global').fclog("Error Selecting1 : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
             }
           // if school is unapproved 
           if(rows[0].status == 0){
            QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where teacher_ac_no = '"+input.teacher_ac_no+"' and school_id = '"+input.school_id+"'";
            req.app.get('connection').query(QUERY, function(err, rows, fields){
            if(err){
              if(config.debug){
                req.app.get('global').fclog("Error Selecting2 : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
                 }
                }
                // if record is 0,1
                 if(_.size(rows) >= 1){
                  res.json({error_code:1, error_msg:message.school_under_verification});
                  return false;
                  }else if(_.size(rows) == 0){
                  // function call
                   module.exports.addClassinfo_valid(req, res, input);
                  }
              });
             }else if(rows[0].status == "2" || rows[0].status == "-1"){
              // if school delete or desiable
              res.json({error_code:1, error_msg:message.school_under_verification});
              return false;
             }else if(rows[0].status == "1"){
              // if school is approved
               // function call
              QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where school_id = '"+input.school_id+"' and class_name like '"+input.class_name+"' and grade like '"+input.grade+"'";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting3 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }
          if(_.size(rows) == 0){
            QUERY = "SELECT status FROM "+config_constant.EDUSER+" where member_no = '"+input.teacher_ac_no+"'";
                req.app.get('connection').query(QUERY, function(err, rows_member_no, fields){
            if(err){
              if(config.debug){
              req.app.get('global').fclog("Error Selecting1 : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
              }
             }
            if(rows_member_no[0].status == "1"){
               module.exports.addClassinfo_valid(req, res, input);
              }else if(rows_member_no[0].status == "0"){
               //teacher is not approved
                 QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where teacher_ac_no = '"+input.teacher_ac_no+"'";
                    req.app.get('connection').query(QUERY, function(err, rows_teacher_ac_no, fields){
                  if(err){
                    if(config.debug){
                    req.app.get('global').fclog("Error Selecting1 : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                    }
                   }
				           if(_.size(rows_teacher_ac_no) > 0){
                    res.json({error_code:1, error_msg:message.teacher_under_verification});
                  }else{
                    module.exports.addClassinfo_valid(req, res, input); 
                  }
                });
              }else{
                 res.json({error_code:1, error_msg:message.technical_error});
               }
         });
          }else{ 
                    res.json({error_code:1, error_msg:message.duplicate_class});
                    return false;
                  }
                 })
             }
          });
         }else if(typeof input.school_id == 'undefined' || typeof input.school_id == '' || input.school_id == '0'){
            // school is not selected
            QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where teacher_ac_no = '"+input.teacher_ac_no+"'"
            req.app.get('connection').query(QUERY, function(err, rows, fields){
            if(err){
              if(config.debug){
                req.app.get('global').fclog("Error Selecting4 : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
                 }
                }
                // if no of record is 0, 1
                if(_.size(rows) >= 1){
                  res.json({error_code:1, error_msg:message.school_not_join});
                  return false;
                  }else if(_.size(rows) == 0){
                  // function call
                   module.exports.addClassinfo_valid(req, res, input);

                  }
              });
          }
            
},


// function call addClassinfo

  addClassinfo_valid: function (req, res, input){
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classinfo_access');
      var data = [], output={};
      var SET = "";

      if(typeof input.class_name != 'undefined'){
        SET += " class_name=?, ";
        data.push(input.class_name.trim());
      }
      if(typeof input.grade != 'undefined'){
        SET += " grade=?, ";
        data.push(input.grade.trim());
      }
      if(typeof input.image != 'undefined'){
        SET += " image=?, ";
        data.push(input.image.trim());
      }
      if(typeof input.teacher_ac_no != 'undefined'){
        SET += " teacher_ac_no=?, ";
        data.push(input.teacher_ac_no.trim());
      }
      if(typeof input.school_id != 'undefined'){
        SET += " school_id=? ";
        data.push(input.school_id.trim());
      }
      QUERY1 = "SELECT class_id FROM "+config_constant.CLASSINFO+" WHERE teacher_ac_no = '"+input.teacher_ac_no+"'";
      req.app.get('connection').query(QUERY1, function(err, rows, fields){
        if(err){
          if(config.debug){
            req.app.get('global').fclog("Error Selecting : %s ",err);
            res.json({error_code:1, error_msg:message.technical_error});
            return false;
          }
        }
    
          if(_.size(rows) >= '10'){
          
             res.json({'status':message.failure, 'comments':message.nomoreclass});
              return false;
          }else{

      QUERY1 = "SELECT id FROM "+config_constant.CLASSINFO+" ORDER BY id DESC limit 1";
          req.app.get('connection').query(QUERY1, function(err, rows, fields){
            if(err){
              if(config.debug){
                req.app.get('global').fclog("Error Selecting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
            }else{
              result = rows[0];
              count= _.size(rows);
              if(count < 1){
                result = encryption.encryptnew('1');
              }else if(count >= 1){
                data1 = +result['id']+'1';
                result = encryption.encryptnew(data1);
              } 
             
              QUERY = "INSERT INTO "+config_constant.CLASSINFO+"  SET "+SET+", class_id='"+result+"', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '";
             
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){ 
                if(err){ 
                  if(config.debug){
                      req.app.get('global').fclog("Error Inserting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                  QUERY = " SELECT * FROM "+config_constant.CLASSINFO+" where id ='"+rows.insertId+"'";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }else{
                      class_id = rows[0]['class_id'];
                      SELECT = "SELECT * FROM "+config_constant.EDITSKILLS+" where class_id='0' ORDER BY id ASC";  
                      req.app.get('connection').query(SELECT, data, function(err, rows, fields){
                       if(err){
                         if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                       }else{
                          size = _.size(rows);
                          _.forEach(rows, function(obj){
                            INSERT = "INSERT INTO "+config_constant.EDITSKILLS+" (name,image,class_id,pointweight,created_at,updated_at) VALUES(?,?,?,?,?,?) ";                                       
                            req.app.get('connection').query(INSERT,[obj['name'], obj['image'], class_id, obj['pointweight'],  _global.js_yyyy_mm_dd_hh_mm_ss(),_global.js_yyyy_mm_dd_hh_mm_ss()], function(err, rows, fields){
                              if(err){
                               if(config.debug){
                                    req.app.get('global').fclog("Error Inserting : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                             }
                           });
                        });
                        QUERY = " SELECT * FROM "+config_constant.CLASSINFO+" where class_id='"+class_id+"'";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                        if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Selecting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                         }else{
                           output.status = message.success;
                           output.comments = message.success;
                           output.user_list = rows;
                           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo_access');
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
}

});
},
/**
* All the request of Teacher with put Method 
*
* @param req, res
* @return response
*/
updateClassinfo:function (req, res){
  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classinfo/update_access');
  var data = [], output={};
  var SET = "";
  var input = JSON.parse(JSON.stringify(req.body));
  if(typeof input.class_name != 'undefined'){
    SET += " class_name=?, ";
    data.push(input.class_name.trim());
  }
  if(typeof input.grade != 'undefined'){
    SET += " grade=?, ";
    data.push(input.grade.trim());
  }

  if(typeof input.image != 'undefined'){
    SET += " image=?, ";
    data.push(input.image.trim());
  }
   if(typeof input.class_id != 'undefined'){
    SET += " class_id=?, ";
    data.push(input.class_id.trim());
  }  
  SET = SET.trim().substring(0, SET.trim().length-1);
  QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" WHERE  class_id=? ";
  req.app.get('connection').query(QUERY, input.class_id, function(err, rows, fields){
    if(err){
      if(config.debug){
          req.app.get('global').fclog("Error Selecting : %s ",err);
          res.json({error_code:1, error_msg:message.technical_error});
          return false;
        }
    }else{
      QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where school_id = '"+input.school_id+"' and class_id !='"+input.class_id+"' and class_name like '"+input.class_name+"' and grade like '"+input.grade+"'";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting3 : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                    }

      if(_.size(rows) == 0){
      QUERY = "UPDATE "+config_constant.CLASSINFO+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id='"+input.class_id+"'";
      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
        if(err){
          if(config.debug){
              req.app.get('global').fclog("Error Updating : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
            }
        }else{
          QUERY = " SELECT * FROM "+config_constant.CLASSINFO+" WHERE id='"+input.class_id+"'";
          req.app.get('connection').query(QUERY,input.class_id, function(err, rows, fields){
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
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'classinfo/update_access');
              res.json(output);
            }
          });
        }
      });
      }else{
        res.json({error_code:1, error_msg:message.duplicate_class});
        return false;
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
deleteClassinfo: function (req, res){
        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classinfo/delete_access');
        var data = [], output={};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if(typeof input.class_id != 'undefined'){
          SET += " class_id=?, ";
          data.push(input.class_id.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length-1);
        QUERY = "DELETE FROM "+config_constant.CLASSINFO+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
          if(err){
            if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.STUDENTINFO+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.EDITSKILLS+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.GROUPINFO+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.GROUP+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.GROUPINFO+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.CLASSSTORIES+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.CLASSCOMMENT+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.CLASS_STORYLIKE+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.STUDENTINFO_POINT+" WHERE class_id = '"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
               if(config.debug){
                req.app.get('global').fclog("Error Deleting : %s ",err);
                res.json({error_code:1, error_msg:message.technical_error});
                return false;
              }
          }
        });
        QUERY = "DELETE FROM "+config_constant.ATTENDANCE+" WHERE class_id = '"+input.class_id+"' ";
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
        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'classinfo/delete_access');
        res.json(output);
       },

     

	   studentListPortal: function (req, res){
		  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'classinfo/studentlistPortal');
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var where = " WHERE 1=1 ";
		  if(typeof query_str.student_name != 'undefined'){
                 where += " AND name like ? ";
                 data.push(query_str.student_name.trim()+"%");
              }
	if (typeof query_str.classId != 'undefined') {  
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " desc ":" asc ");
		QUERY = "SELECT name as stu_name,parent_no,student_no FROM "+config_constant.STUDENTINFO+" "+where+" AND class_id='"+query_str.classId+"' ORDER BY name "+sort_by+" ";
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
           output.student_list = rows;
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo/studentlistPortal');
           res.json(output);
      });
	}
	  else{
		   output.timestamp = req.query.timestamp;
           output.status = message.failure;
		   output.comments = message.failure;
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'classinfo/studentlistPortal');
           res.json(output);
		  }
  },

saveCsvFile:function(req, res){	      
		var input = JSON.parse(JSON.stringify(req.body));	  
        var output = {};				
		 if (!req.file) {
            if (config.debug) {
                req.app.get('global').fclog("No file was uploaded.");
                res.json({error_code: 1, error_msg: message.technical_error});
                return false;
            }
        }		
		var file = req.file;     
        var name = file.originalname.split('.');
        if (file.size > 20 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            res.json({err: 'File greater than 20mb is not allowed'});
            return false;
        }		
		if (name[1] == 'csv' ) {
            var img = file.originalname;
            var data = fs.readFileSync(file.path);
            fs.writeFile(config.upload_path+'/tmp/' + file.originalname, data);
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
			 
			 var csvData = [];
             fs.createReadStream(config.upload_path+'/tmp/' + file.originalname)
                .pipe(parse({delimiter: ','}))
                .on('data', function (csvrow) {                    
                    csvData.push(csvrow);
                })
                .on('end', function () {  
                      var lengthValue = csvData.length;
                     var created_at =  _global.js_yyyy_mm_dd_hh_mm_ss();  
                     for(var i = 0;i<lengthValue;i++){
                        var parent_no = _global.getCode('P');
                        var student_no = _global.getCode('S');
                        csvData[i].push(student_no);
                        csvData[i].push(parent_no);
                        csvData[i].push(image);
                        csvData[i].push(input.class_id);
                        csvData[i].push('0');
                        csvData[i].push(created_at);                      
                       } 				
                      QUERY = "insert into "+config_constant.STUDENTINFO+" (name,student_no,parent_no,image,class_id,status,created_at) values ?";   
                        req.app.get('connection').query(QUERY,[csvData], function (err, rows, fields) {
                        if (err) {                             
                            req.app.get('global').fclog("Error Selecting : %s ", err);
                            res.end();
                        }else{
							
						if (fs.existsSync(config.upload_path+'/tmp/' + file.originalname)) {
                         fs.unlinkSync(config.upload_path+'/tmp/' + file.originalname);
                      } else {
                       res.json({err: 'Invalid file format!'});
                       return false;
                          }	
							
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
		               // mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'classinfo/studentcsvPortal');
                        res.json(output)
                    }
										
                });
                    });
			
			 });
}
}