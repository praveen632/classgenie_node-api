var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var validator = require("../node_modules/email-validator");

module.exports = {
 checkLogin: function (req, res){
 
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'login_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
                 if(typeof query_str.email != 'undefined'){
                   where += " AND (email=? OR username=? OR member_no=?) ";
                   data.push(query_str.email.trim(),query_str.email.trim(),query_str.email.trim());
                 }
                
                if(typeof query_str.password != 'undefined'){
                   where += " AND password=? ";
                   data.push(md5(query_str.password));
                }
                
                QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+" and status > '-1'";
				          req.app.get('connection').query(QUERY, data, function(err, rows, fields)
                {
               
               if(err || rows.length == 0){
                 	req.app.get('global').fclog("Error Selecting1 : %s ",err);
                  output.status = message.failure;
                  output.comments = message.noresult;
                  res.json(output);
                }else{
               // select school name with login   
                   var result = rows[0];
                   if((result['type'] == 2 && result['school_id'] !=0) || (result['type'] == 1 && result['school_id'] !=0) || (result['type'] == 5 && result['school_id'] !=0)) {
                   QUERY = "SELECT school_name FROM "+config_constant.SCHOOLS+" where school_id = '"+result['school_id']+"' ";
                   req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                   if(err || rows.length == 0){
                    req.app.get('global').fclog("Error Selecting2 : %s ",err);
                    output.status = message.failure;
                    output.comments = message.noresult;
                    res.json(output);
                }else{
                // if school id is not 0 then get output
                   output.status = message.success;
                   output.comments = message.success;
                   output.user_list = rows;
                   output.school = rows1;
                   res.json(output);
                 }
               });
              }else{
               // if school id is 0 then get output
                   output.timestamp = req.query.timestamp;
                   output.status = message.success;
                   output.comments = message.success;
                   output.user_list = rows;
                   res.json(output);
               } 
              }
               mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'login_access');
               //
          });
      }

}