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
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      className: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'user_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.parent_ac_no != 'undefined'){
                   where += " AND parent_ac_no=? ";
                   data.push(query_str.parent_ac_no.trim());
               }
               
               QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY id "+sort_by+" "+limit+"  ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                } 
                var class_id = [];               
                _.each(rows, function(item){
                  class_id += ','+"'"+item.class_id+"'";
                });
                if(class_id != ''){
                  class_id = class_id.substring(1);
                }
                QUERY = "SELECT class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
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
                output.class_list = rows1;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'user_access');
                res.json(output);
              });
            });
      }
    }



