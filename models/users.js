var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var _global = require('../common/global');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      listUsers: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'user_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.user_id != 'undefined'){
                   where += " AND user_id=? ";
                   data.push(query_str.user_id.trim());
               }
               if(typeof query_str.name != 'undefined'){
                   where += " AND name=? ";
                   data.push(query_str.name.trim());
                }
                if(typeof query_str.email_id != 'undefined'){
                   where += " AND email_id=? ";
                   data.push(query_str.email_id.trim());
                }
                if(typeof query_str.user_id_not_in != 'undefined'){
                   where += " AND user_id<>? ";
                   data.push(query_str.user_id_not_in.trim());
                }
               QUERY = "SELECT * FROM "+config_constant.USER+" "+where+" ORDER BY user_id "+sort_by+" "+limit+" ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  return false;
                }
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'user_access');
                res.json(output);
          });
      },

      /**
       * All the request of user with GET method and execute in search operation.
       *
       * @param req, res
       * @return response
       */
      searchUsers: function (req, res){
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'user_access');
             var query_str = url.parse(req.url,true).query;
             var data = [], output={};
             var where = " WHERE 1=1 ";
             if(typeof query_str.user_id != 'undefined'){
                 where += " AND user_id like ? ";
                 data.push(query_str.user_id.trim()+"%");
             }
             if(typeof query_str.name != 'undefined'){
                 where += " AND name like ? ";
                 data.push(query_str.name.trim()+"%");
              }
             if(typeof query_str.email_id != 'undefined'){
                 where += " AND email_id like ? ";
                 data.push(query_str.email_id.trim()+"%");
              }
             QUERY = " SELECT * FROM "+config_constant.USER+" "+where+" ORDER BY user_id DESC ";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  return false;
                }
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'user_access');
                res.json(output);
          });
      },


      /**
       * All the request of user with Post Method 
       *
       * @param req, res
       * @return response
       */
      saveUser: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'user_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.email_id != 'undefined'){
                 SET += " email_id=?, ";
                 data.push(input.email_id.trim());
             }
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT user_id FROM "+config_constant.USER+" WHERE  email_id=?";
             req.app.get('connection').query(QUERY, [input.email_id], function(err, rows, fields){
                if(err){
                   req.app.get('global').fclog("Error Selecting : %s ",err);
                    return false;
                 }
                 else if(_.size(rows)>0){
                    res.json({'status':message.failure, 'comments':message.email_aready_exist});
                  }
                 else
                 {
                      QUERY = "INSERT INTO "+config_constant.USER+"  SET "+SET;
                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            req.app.get('global').fclog("Error In Inserting : %s ",err);
                            return false;
                           }
                         else
                         {
                             QUERY = " SELECT * FROM "+config_constant.USER+" ORDER BY user_id DESC ";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  return false;
                                }
                               else
                                {
                                  output.timestamp = req.query.timestamp;
                                  output.status = message.success;
                                  output.comments = message.success;
                                  output.user_list = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'user_access');
                                  res.json(output);
                                }
                             });
                          }
                       });
                 }
            });
       },

      /**
       * All the request of user with put Method 
       *
       * @param req, res
       * @return response
       */
      updateUser: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'user_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.email_id != 'undefined'){
                 SET += " email_id=?, ";
                 data.push(input.email_id.trim());
             }
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT user_id FROM "+config_constant.USER+" WHERE  email_id=? AND user_id <> ?";
             req.app.get('connection').query(QUERY, [input.email_id, input.user_id], function(err, rows, fields){
                 if(err){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                  return false;
                 }
                 else if(_.size(rows)>0){
                     res.json({'status':message.failure, 'comments':message.email_aready_exist});
                  }
                 else
                 {
                       QUERY = "UPDATE "+config_constant.USER+"  SET "+SET+" WHERE user_id='"+input.user_id+"'";
                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            req.app.get('global').fclog("Error In Updating : %s ",err);
                          return false;
                         }
                         else
                         {
                             QUERY = " SELECT * FROM "+config_constant.USER+" ORDER BY user_id DESC ";
                             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                               if(err){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                 return false;
                               }
                               else
                                {
                                  output.timestamp = req.query.timestamp;
                                  output.status = message.success;
                                  output.comments = message.success;
                                  output.user_list = rows;
                                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'user_access');
                                  res.json(output);
                                }
                             });
                          }
                      });
                 }
             });

      },

       /**
       * All the request of user with delete Method 
       *
       * @param req, res
       * @return response
       */
      deleteUser: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(_.extend(req.body, req.query))}, 'user_access');
           var output={};
           var query_str = url.parse(req.url,true).query;
           QUERY = "DELETE FROM "+config_constant.USER+" WHERE user_id IN (?)";
           req.app.get('connection').query(QUERY, [query_str.user_id], function(err, rows, fields){
                 if(err){
                    req.app.get('global').fclog("Error Deleting : %s ",err);
                   return false;
                 }
                 QUERY = "SELECT * FROM "+config_constant.USER+" ORDER BY user_id DESC ";
                 req.app.get('connection').query(QUERY, function(err, rows, fields){
                   if(err){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                    return false;
                   }
                   else
                    {
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      output.user_list = rows;
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'user_access');
                      res.json(output);
                    }
                 });
           });
      },
      
}    