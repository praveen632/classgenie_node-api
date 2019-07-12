var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var sendmail = require('../models/sendmail');


module.exports = {
      studentlist:function(req,res){
            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'connectparent/studentlist_access');
            var query_str = url.parse(req.url,true).query;
            var data = [], output={};
            var where = " WHERE 1=1 ";
            var SET ="";
            QUERY = "SELECT * from "+config_constant.STUDENTINFO+" WHERE class_id='"+query_str.class_id+"'";
            req.app.get('connection').query(QUERY,function(err,rows,result){      	
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
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'connectparent/studentlist_access');
                res.json(output);
              }
            });
          },
        }