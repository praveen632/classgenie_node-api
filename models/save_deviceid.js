var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var connection = require('../common/connection');
module.exports = {
      /**
       * Save device.
       *
       * @param req, res
       * @return response
       */
      save_deviceid: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'save_deviceid_access');
              var input = JSON.parse(JSON.stringify(req.body));
              var data = [], output={};
              if(input.device_id=="" || input.device_id==null || input.device_id=='null'){
                   res.json({error_code:1, error_msg:message.device_id_status});
                   return false;
              }
              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" WHERE  member_no=" +"'"+input.member_no+"'"+" AND device_id="+"'"+input.device_id+"'";
              req.app.get('connection').query(QUERY, function(err, rows, fields){
              if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
               }
               else if(_.size(rows)==0){
               QUERY = "INSERT INTO "+config_constant.NOTIFICATION+" SET status='1', member_no=" +"'"+input.member_no+"'" +", device_id="+"'"+input.device_id+"'";
               req.app.get('connection').query(QUERY,function(err, rows, result){
                   if(err){
                     if(config.debug){
                        req.app.get('global').fclog("Error Inserting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                      }
                 });
             }
             output.timestamp = req.query.timestamp;
             output.status = message.success;
             output.comments = message.success;
             output.user_list = rows;
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'save_deviceid_access');
             res.json(output);
             });
   },
  /**
 * Update device.
 *
 * @param req, res
 * @return response
 */
 save_deviceid_update: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'save_deviceid/update_access');
              var input = JSON.parse(JSON.stringify(req.body));
			        var data = [], output={};
              if(input.device_id=="" || input.device_id==null || input.device_id=='null'){
                   res.json({error_code:1, error_msg:message.device_id_status});
                   return false;
              }			   	
               QUERY = "UPDATE  "+config_constant.NOTIFICATION+" SET status='"+input.status+"' WHERE  member_no=" +"'"+input.member_no+"'"+" AND device_id="+"'"+input.device_id+"'";
                   req.app.get('connection').query(QUERY, function(err, rows, result){
                     if(err){
                        if(config.debug){
                             req.app.get('global').fclog("Error Selecting : %s ",err);
							               res.json({error_code:1, error_msg:message.technical_error});
							               return false;
                           }
                      }else{
                        if(rows.affectedRows == 0){
								          res.json({error_code:1, error_msg:message.noresult});
								          return false;
							 }
							 output.timestamp = req.query.timestamp;
							 output.status = message.success;
							 output.comments = message.success;
							 output.user_list = rows;
							 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'save_deviceid/update_access');
							 res.json(output);
						 }
					 });				
           },
           /**
           * Get device.
           *
           * @param req, res
           * @return response
           */
		   
		   save_deviceid_getdata: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'save_deviceid/getdata_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              if(query_str.device_id=="" || query_str.device_id==null || query_str.device_id=='null'){
                   res.json({error_code:1, error_msg:message.device_id_status});
                   return false;
              }
              QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" WHERE  member_no=" +"'"+query_str.member_no+"'"+" AND device_id="+"'"+query_str.device_id+"'";
               req.app.get('connection').query(QUERY, function(err, rows, fields){
               if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
				  }
               }
               if(_.size(rows)==0){
							res.json({error_code:1, error_msg:message.noresult});
							return false;
						}else{
						 output.timestamp = req.query.timestamp;
             output.status = message.success;
             output.comments = message.success;
             output.device_list = rows;
             mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'save_deviceid/getdata_access');
             res.json(output);
						 }
            });
				}
		}