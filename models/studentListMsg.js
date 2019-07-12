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
      listStudent: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'studentmessagelist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={}, parent_ac_no='', parent_detail = {};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
               }
    			    if(query_str.source == 'chat'){
    			       QUERY = "SELECT DISTINCT parent_ac_no FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY name "+sort_by+"  ";
					   console.log(QUERY);
    			    }else{
                      QUERY = "SELECT name, student_no, parent_no, parent_ac_no, class_id, image FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY name "+sort_by+" ";
			        console.log(QUERY);

					}
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Selecting : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                    }
                     output.user_list = [];
                    _.each(rows, function(item){
                       output.user_list.push(item);
                       if(item.parent_ac_no != '0'){
                          parent_ac_no += ','+item.parent_ac_no;
                        }
                    });
                    if(parent_ac_no != ''){
                       parent_ac_no = parent_ac_no.substring(1);
                    }
                    QUERY = "SELECT name, member_no, email FROM "+config_constant.EDUSER+" WHERE member_no IN ("+parent_ac_no+") and status > '-1'";
                    req.app.get('connection').query(QUERY, function(err, rows, fields){
                           _.each(rows, function(item){
                            parent_detail[item.member_no] = item;
                         });
                        _.each(output.user_list, function(item, index){
                           if(typeof parent_detail[item.parent_ac_no] != 'undefined'){
                                output.user_list[index]['parent_detail'] = parent_detail[item.parent_ac_no];
                            }
                        });
                        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'studentmessagelist_allPost');
                       res.json(output);
					   console.log(output);
                    });
                });
              }
    }
