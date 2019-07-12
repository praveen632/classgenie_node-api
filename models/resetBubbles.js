var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      listBubbles: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'resetbubbles_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
               }                           
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE class_id = ? ";
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
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'resetbubbles_access');
                res.json(output);
          });
      },
  /**
   * Reset per student bubbles.
   *
   * @param req, res
   * @return response
   */
   studentBubble: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'resetbubbles_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var input = JSON.parse(JSON.stringify(req.body));
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
               _.forEach(input, function(obj){
               QUERY = "UPDATE "+config_constant.STUDENTINFO+"  SET pointweight = '0', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE id=?";
               req.app.get('connection').query(QUERY,[obj['id']], function(err, rows, fields){ 
                  if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Updating : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }
                  QUERY = "UPDATE "+config_constant.CLASSINFO+"  SET pointweight= `pointweight` - '"+[obj['pointweight']]+"', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id=? ";
                  req.app.get('connection').query(QUERY,[obj['class_id']], function(err, rows, fields){ 
                  if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Updating : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }
                 });               
               });
             });
          QUERY = "SELECT * FROM "+config_constant.CLASSINFO+" where class_id= '"+input[0]['class_id']+"'";
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
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'resetbubbles_access');
             res.json(output);  
           }
         });
        },


        groupBubble: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'resetbubbles/group_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var input = JSON.parse(JSON.stringify(req.body));
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              _.forEach(input, function(obj){
                QUERY = "UPDATE "+config_constant.GROUPINFO+"  SET pointweight = '0', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE class_id=?";
                req.app.get('connection').query(QUERY,[obj['class_id']], function(err, rows, fields){ 
                      if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Updating : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                      }
                    });
               });
              QUERY = "SELECT * FROM "+config_constant.GROUPINFO+" where class_id= '"+input[0]['class_id']+"'";
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
                 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'resetbubbles/group_access');
                 res.json(output);  
               }
             });
             }
      }
  