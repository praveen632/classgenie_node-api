var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var redis = require("redis");
var md5 = require("js-md5");
var config = require('../common/config');
var connection = require('../common/connection');
var fs = require('fs');
module.exports = {
/**
* Display listing of resources.
*
* @param req, res
* @return response
*/
editSkillsList:function (req, res){
        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'editskills_access');
        var query_str = url.parse(req.url,true).query;
        var data = [], output={};
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
        if(typeof query_str.class_id != 'undefined'){
          where += " AND class_id=? AND status = '1'";
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
          output.timestamp = req.query.timestamp;
          output.status = message.success;
          output.comments = message.success;
          output.user_list = rows;
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'editskills_access');
          res.json(output);
        });
      },

/**
* Display image list of resources.
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
              Key = 'SKILLIMG_'+md5("SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 3 AND status = '1' ");
              client.get(Key, function(err, data) {
                   if(err || data === null) {
                       QUERY = "SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 3 AND status = '1' ";
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
           QUERY = "SELECT image FROM "+config_constant.IMAGELIST+" WHERE type = 3 AND status = '1' ";
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
* Add skills.
*
* @param req, res
* @return response
*/
addEditSkills:function (req, res){
      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'editskills_access');
      var data = [], output={};
      var SET = "";
      var input = JSON.parse(JSON.stringify(req.body));
      var b = new Buffer(input.name, 'base64')
      var name = b.toString();
      
      if(typeof name!= 'undefined'){
        SET += " name=?, ";
        data.push(name.trim());
      }
      if(typeof input.image != 'undefined'){
        SET += " image=?, ";
        data.push(input.image.trim());
      }
      if(typeof input.pointweight != 'undefined'){
        SET += " pointweight=?, ";
        data.push(input.pointweight.trim());
      }
      if(typeof input.class_id != 'undefined'){
        SET += " class_id=?, ";
        data.push(input.class_id.trim());
      }
      SET = SET.trim().substring(0, SET.trim().length-1);
      QUERY = "SELECT name FROM "+config_constant.EDITSKILLS+" WHERE  name='"+input.name+"'";
      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
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
          QUERY = "INSERT INTO "+config_constant.EDITSKILLS+" SET "+SET+", created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '"; 
          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
              if(config.debug){
                  req.app.get('global').fclog("Error Inserting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
            }else{
              QUERY = "SELECT * FROM "+config_constant.EDITSKILLS+" where class_id ='"+input.class_id+"'";
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
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'editskills_access');
                res.json(output);
              }
            });
          }
        });
      }
   });
},
/**
* Update Skills
*
* @param req, res
* @return response
*/
updateEditSkills: function (req, res){
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'editskills/update_access');
          var data = [], output={};
          var SET = "";
          var input = JSON.parse(JSON.stringify(req.body));
          var b = new Buffer(input.name, 'base64')
          var name = b.toString();
      
          if(typeof name!= 'undefined'){
            SET += " name=?, ";
            data.push(name.trim());
          }
          if(typeof input.image != 'undefined'){
            SET += " image=?, ";
            data.push(input.image.trim());
          }
          if(typeof input.pointweight != 'undefined'){
            SET += " pointweight=?, ";
            data.push(input.pointweight.trim());
          }
          SET = SET.trim().substring(0, SET.trim().length-1);
          QUERY = "UPDATE "+config_constant.EDITSKILLS+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id='"+input.id+"'";
          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Updating : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                  QUERY = " SELECT * FROM "+config_constant.EDITSKILLS+" where id ='"+input.id+"'";
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
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'editskills/update_access');
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
deleteEditSkills: function (req, res){
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'editskills/delete_access');
          var data = [], output={};
          var SET = "";
          var input = JSON.parse(JSON.stringify(req.body));
          if(typeof input.id != 'undefined'){
            SET += " id=?, ";
            data.push(input.id.trim());
          }
          SET = SET.trim().substring(0, SET.trim().length-1);
          QUERY = "UPDATE "+config_constant.EDITSKILLS+"  SET status = '0' WHERE id='"+input.id+"'";
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
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'editskills/delete_access');
                res.json(output);
              }   
          });
        }
      }