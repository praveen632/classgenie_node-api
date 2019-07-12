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
      teacherlistchat: function (req, res){        
      	      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'teacher/chat_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              //To get the classid and student name from studentinfo
              QUERY = "SELECT distinct class_id FROM "+config_constant.STUDENTINFO+"  where parent_ac_no='"+query_str.parent_ac_no+"'";
               req.app.get('connection').query(QUERY, function(err, rows, fields){
                if(err){
                   if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                 }
                 var studentinfo=[], class_id_info={}, teacher_info = {};
                 if(_.size(rows)>0){
                      var class_id='';
                      for(var i=0;i<_.size(rows);i++){
                        var obj = {};
                        obj.class_id = rows[i].class_id;
                        studentinfo.push(obj);
                        class_id += ",'"+rows[i].class_id+"'";
                      }  
                   //To get the class Name and Teacher account number from classinfo   
                   QUERY = "SELECT class_id,class_name,teacher_ac_no FROM "+config_constant.CLASSINFO+"  where class_id in ("+class_id.substring(1)+")"; 
                    req.app.get('connection').query(QUERY, function(err, rows, fields){
                        var teacher_ac_no='';
                         for(var i=0;i<_.size(rows);i++){
                              var key = rows[i].class_id.trim();
                              class_id_info[key] = {};
                              class_id_info[key].class_name = rows[i].class_name;
                              class_id_info[key].teacher_ac_no = rows[i].teacher_ac_no;
                              teacher_ac_no += ",'"+rows[i].teacher_ac_no+"'";
                          }
                         //To get the Teacher name from eduser 
                          QUERY = "SELECT member_no, name FROM "+config_constant.EDUSER+"  where member_no in ("+teacher_ac_no.substring(1)+") and status > '-1'";
                          req.app.get('connection').query(QUERY, function(err, rows, fields){
                               for(var i=0;i<_.size(rows);i++){
                                   teacher_info[rows[i].member_no] = {};
                                   teacher_info[rows[i].member_no].name = rows[i].name;
                               }
                               var studentinfo_response = [];
                               _.each(studentinfo, function (obj){                  
                                   obj.class_info = class_id_info[obj.class_id];
                                   studentinfo_response.push(obj);
                               });
                               _.each(studentinfo_response, function (obj, index){
                                 studentinfo_response[index].teacher_info = teacher_info[obj.class_info.teacher_ac_no];
                                   });
                               res.json(studentinfo_response);
                          });     
                     });   
                 }  
                 else{
                  res.json([]);
                 }   
            });
       }
  }     	