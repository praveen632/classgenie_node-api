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
var moment = require('moment-timezone');
module.exports = {
     /**
       * All the request of student report with GET method.
       *
       * @param req, res
       * @return response
       */
     class_perform: function(req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'report/student_access');
              var data = [], output={}, customize_skills_id = '',student_no='', name = [], id = '', student_info_no = '';
              var SET = "";
              var query_str = url.parse(req.url,true).query; 
              var input = JSON.parse(JSON.stringify(req.body));
		          SET = SET.trim().substring(0, SET.trim().length-1);      
              student_no = [];
              QUERY = "SELECT student_no FROM "+config_constant.STUDENTINFO+" WHERE  class_id='"+query_str.class_id+"'";   
                 console.log(QUERY);
                 req.app.get('connection').query(QUERY,  function(err, rows_student_no, fields){
               _.each(rows_student_no, function(item){
                student_no += ','+"'"+item.student_no+"'";
               }); 
                if(student_no != ''){
                  student_no = student_no.substring(1);
                }
                
               if(_.size(rows_student_no) <= '0'){
                  res.json({'status':message.failure, 'comments':message.noresult});
               }else{              
               // calculate according to date range  
                if(query_str.datetoken == "today"){
                  var startdate = moment().format('YYYY-MM-DD');
                  var enddate   = moment().add(1, 'day').format('YYYY-MM-DD');
                }else if(query_str.datetoken == "thisweek"){
                  var startdate = moment().startOf('week').format('YYYY-MM-DD');
                  var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                }else if(query_str.datetoken == "thismonth"){
                  var date = new Date();
                  var enddate = moment().format('YYYY-MM-DD');
                  var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);var startdate = moment(firstDay).format('YYYY-MM-DD');
                }else if(query_str.datetoken == "daterange"){
                  var startdate = query_str.startdate;
                  var enddate = query_str.enddate;
                }
          // Query according to time period    
           QUERY = "SELECT DISTINCT(customize_skills_id), created_at, student_info_no, class_id, sum(point) as point FROM "+config_constant.STUDENTINFO_POINT+" WHERE student_info_no IN ("+student_no+") and created_at BETWEEN '"+startdate+"' AND '"+enddate+"' GROUP BY customize_skills_id";
           req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error Selecting1 : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
               }
              if(_.size(rows) > 0){
                point = {};
                output.point = []; 
                class_id = [];
                student_info_no = [];
                _.each(rows, function(item){
                output.point.push(item);
                customize_skills_id += ','+"'"+item.customize_skills_id+"'";
                class_id += ','+"'"+item.class_id+"'";
                student_info_no += ','+"'"+item.student_info_no+"'";
               }); 
                if(customize_skills_id != ''){
                  customize_skills_id = customize_skills_id.substring(1);
                }
                if(class_id != ''){
                  class_id = class_id.substring(1);
                }
                if(student_info_no != ''){
                  student_info_no = student_info_no.substring(1);
                }
                //select teacher_ac_no from class info. 
                QUERY = "SELECT teacher_ac_no, class_name, class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
                req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                       if(config.debug){
                            req.app.get('global').fclog("Error Selecting2 : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                     }                  
                     //result = rows[0];
                     name_node = [], member_no = [];
                     _.each(rows, function(item){
                       name_node[item.class_id] = item;
                       member_no += ","+"'"+item.teacher_ac_no+"'";
                     });
                    if(member_no != ''){
                      member_no = member_no.substring(1);
                     }
                    teacher_name = {};
                     QUERY1 = "SELECT name, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") and status > '-1'";
                     req.app.get('connection').query(QUERY1, data, function(err, rows2, fields){
                       _.each(rows2, function(item){
                          teacher_name[item.member_no] = item.name;
                       });
                       //Select all data from customize skill table by customize_skills_id.  
                       var item_node = {};
                       QUERY = " SELECT name, id, pointweight, image FROM "+config_constant.EDITSKILLS+" where id IN ("+customize_skills_id+")";
                       req.app.get('connection').query(QUERY, function(err, rows, fields){
                           _.each(rows, function(item, index){
                             item_node[item.id] = item;                     
                           });

                            _.each(output.point, function(item, index){
                            if(typeof item_node[item.customize_skills_id] != 'undefined'){
                             output.point[index]['customize_detail'] = item_node[item.customize_skills_id];
                            }
                         });
                        //select student name from student info table.
                        student_node = {};
                        QUERY = "SELECT name, student_no FROM "+config_constant.STUDENTINFO+" WHERE student_no IN ("+student_info_no+") ";
                        req.app.get('connection').query(QUERY, data, function(err, rows, fields){                  
                           _.each(rows, function(item, index){
                            student_node[item.student_no] = item.name;                      
                           });  
                                        
                           _.each(output.point, function(item, index){                    
                               if(typeof student_node[item.student_info_no] != 'undefined'){
                                 output.point[index]['student_name'] = student_node[item.student_info_no];
                                 output.point[index]['class_name'] = name_node[item.class_id];  
                    
                                 output.point[index]['class_name']['teacher_name'] = teacher_name[name_node[item.class_id]['teacher_ac_no']];
                                }
                           });
                            output.timestamp = req.query.timestamp;
                            output.status = message.success;
                            output.comments = message.success;
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'report/student_access');
                            res.json(output);
                           });
                      });
                 });
               });
      }else{
        res.json({'status':message.failure, 'comments':message.noresult});
   }
 });
}
});
}
}