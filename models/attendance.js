var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var moment = require('moment-timezone');
var Base64 = require('js-base64').Base64;
module.exports = {
	     /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
       studentList: function(req, res){
       	      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'attendance/studentlist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.class_id != 'undefined'){
                   where += " AND class_id=? ";
                   data.push(query_str.class_id.trim());
               }
              startdate = query_str.date1; 
              QUERY = "SELECT * FROM "+config_constant.ATTENDANCE+" "+where+" and created_at = '"+startdate+"' '"+sort_by+"' ";
			        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                }
                if(rows.length > 0)
                { 
                QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+" ";                              
                req.app.get('connection').query(QUERY, data, function(err, rows1, fields){
                 if(err){
                    if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                  }
                }     
               QUERY = "SELECT * FROM "+config_constant.ATTENDANCE+" "+where+" and created_at = '"+startdate+"' ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                }       
                var student_detail = {};
                         _.each(rows, function(item){
                               if(typeof student_detail[item.student_no] == "undefined") {
                                  student_detail[item.student_no] = [];  
                               }
                              student_detail[item.student_no].push(item);
                         });
                         _.each(rows1, function(item, index){
                               rows1[index]['student_no'] = student_detail[item.student_no];
                       });      
                       output.user_list = rows1;
                       output.timestamp = req.query.timestamp;
                       output.status = message.success;
                       output.comments = message.success;
                       res.json(output);
                 });
                });    
              }else{                  
                  QUERY = "SELECT name, image, student_no FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY class_id "+sort_by+" ";
                  req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                     }	
				   _.each(rows, function(item, index){
				         var student_no = item.student_no;
					     rows[index]['student_no'] = [];
						 rows[index]['student_no'][0] = {student_no:student_no, attendance:"NA"};
				  	 });
               output.user_list = rows;
               output.timestamp = req.query.timestamp;
               output.status = message.success;
               output.comments = message.success;
               res.json(output);
              });
          }
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'attendance/studentlist_access');
        });
     },
       /**
       * Save attendance of all student.
       *
       * @param req, res
       * @return response
       */ 
       saveAttendance: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'attendance/save_access');
           var data = [], output={};
           var SET = "";
		       var input = JSON.parse(JSON.stringify(req.body));
		       var data= JSON.parse(Base64.decode(input['student_list'])); 
			     var startdate = input.date;	
		       QUERY = "SELECT * FROM "+config_constant.ATTENDANCE+" WHERE class_id='"+data.class_id+"' AND created_at = '"+startdate+"' ";
	         req.app.get('connection').query(QUERY,  function(err, rows, fields){
		           if(err){
                  if(config.debug){
                    req.app.get('global').fclog("Error Selecting : %s ",err);
                    res.json({error_code:1, error_msg:message.technical_error});
                    return false;
                  }
                }
                if(_.size(rows)>0){
                   _.each(data.student_list, function(item){  
                      QUERY = "UPDATE "+config_constant.ATTENDANCE+" SET attendance ='"+item.attendance+"' WHERE class_id='"+data.class_id+"' AND student_no='"+item.student_no+"' ";
                      req.app.get('connection').query(QUERY,  function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                        });
					
                    });
                      output.status = message.success;
                     output.comments = "Updated";
                     res.json(output);
                   }else{ 
                   _.each(data.student_list, function(item){					 
                   INSERT = "INSERT INTO "+config_constant.ATTENDANCE+" (class_id,student_no,attendance,created_at) VALUES('"+data['class_id']+"', '"+item.student_no+"', '"+item.attendance+"','"+startdate+"') ";  
 				           req.app.get('connection').query(INSERT, function(err, rows, fields){
                        if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Inserting : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                          }
                     });						
                 });
				         output.status = message.success;
                 output.comments = message.success;
                 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'attendance/save_access');
                 res.json(output);
                 }				  
               });
              },
              /**
       * Reset attendance of all student.
       *
       * @param req, res
       * @return response
       */ 
       attendance_reset: function(req, res){
            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'attendance/save_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));       
           QUERY = "DELETE FROM "+config_constant.ATTENDANCE+" WHERE class_id='"+input.class_id+"'AND created_at='"+input.date+"'";
           req.app.get('connection').query(QUERY,function(err, rows, fields){     if(err){
            if(config.debug){
              req.app.get('global').fclog("Error Deleting : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
            }
          }
          output.timestamp = req.query.timestamp;
          output.status = message.success;
          output.comments = message.success;
          output.user_list = rows;
          mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'attendance/delete_access');
          res.json(output);
        });
         }
       }