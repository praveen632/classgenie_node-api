var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var pdf = require('../common/genrate_pdf');
module.exports = {
pdfgenerate: function (req, res){    
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'user_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var listData =[];
              var where = " WHERE 1=1 ";
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
                }
                if(typeof query_str.member_no != 'undefined'){
                   where += " AND member_no=? ";
                   data.push(query_str.member_no.trim());
                }
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE class_id='"+query_str.class_id+"' ";
               req.app.get('connection').query(QUERY, function(err, rows, fields){
               listData.push(rows);
               if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{
                  QUERY1 = "SELECT name FROM "+config_constant.EDUSER+" WHERE member_no='"+query_str.member_no+"' and status > '-1'";
                  req.app.get('connection').query(QUERY1, function(err, rows1, fields){
                  listData.push(rows1);                 
                if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }else{                
                  QUERY2 = "SELECT id FROM "+config_constant.CLASSINFO+" WHERE class_id='"+query_str.class_id+"' ";
                  req.app.get('connection').query(QUERY2, function(err, rows2, fields){
                  listData.push(rows2);           
                      if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                      }
                      pdf.genratePdf(listData, req, res);
                       });
                   }
                });
                }             
          });     
  }
}
