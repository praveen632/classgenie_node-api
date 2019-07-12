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
var excel = require('../common/genrate_excel');
module.exports = {
      /**
      * Downloaded excel sheets 
      *
      * @param req, res
      * @return response
      */
       download_excel: function (req, res){
        
                 mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'attendance/save_access');
                 var data = [], output={}; stu_data=[];stu_no='';stu_name='';stu_att='';output_attendence={};
                 var SET = "";
                 var input = JSON.parse(JSON.stringify(req.body));
                      if(input.datetoken == "today"){
                         var startdate = moment().format('YYYY-MM-DD');
						             var enddate   = startdate;
                      }else if(input.datetoken == "thisweek"){
                          var startdate = moment().startOf('week').format('YYYY-MM-DD');
                          var enddate =   moment().endOf('week').format('YYYY-MM-DD');
                      }else if(input.datetoken == "thismonth"){
                          var date = new Date();
                          var enddate = moment().format('YYYY-MM-DD');
                          var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                          var startdate = moment(firstDay).format('YYYY-MM-DD');
                      }else if(input.datetoken == "daterange"){					 					  
                           var starttime= JSON.parse(input['daterange']);  
							     				 var startdate = moment(starttime.date1).format('YYYY-MM-DD');
							             var enddate = moment(starttime.date2).format('YYYY-MM-DD');                           
					            }else if(input.datetoken == "date"){      
                           var startdate = input['daterange'];	 
						              var enddate   = startdate;
                      }            
                      var student_detail = {}; 
                      QUERY = "SELECT student_no,name FROM "+config_constant.STUDENTINFO+" WHERE  class_id='"+input.class_id+"'" ;   
                      req.app.get('connection').query(QUERY,  function(err, rows, fields){
                      _.each(rows, function(item){
                           var key = item['student_no'];
                           delete(item['student_no']);
                           student_detail[key] = item;
                       });
                       QUERY  = "SELECT class_name,grade FROM "+config_constant.CLASSINFO+" WHERE class_id='"+input.class_id+"'";			
                       req.app.get('connection').query(QUERY,function(err,rows_classinfo,fields){
                        if(err){
                          if(config.debug){
                          req.app.get('global').fclog("Error Selecting :%s",err);
                          res.json({error_code:1,error_msg:message.technical_error});
                          return false;
                          }
                        }		  
                        QUERY = "SELECT student_no, attendance,DATE_FORMAT(created_at,'%Y/%m/%d') as date FROM "+config_constant.ATTENDANCE+" WHERE class_id = '"+input.class_id+"' and created_at BETWEEN '"+startdate+"' AND '"+enddate+"' ORDER BY created_at";
                        req.app.get('connection').query(QUERY,  function(err, rows_nodedata, fields){
                           _.each(rows_nodedata, function(item, index){
                                 if(typeof output_attendence[item.student_no] == 'undefined'){
                                      output_attendence[item.student_no] = {};
                                  }  
                                  output_attendence[item.student_no][item['date']] = item.attendance; 
                              });
                              QUERY = "SELECT student_no, attendance, COUNT(attendance) as count FROM "+config_constant.ATTENDANCE+" WHERE class_id = '"+input.class_id+"' and created_at BETWEEN '"+startdate+"' AND '"+enddate+"' GROUP by student_no,attendance";
                              req.app.get('connection').query(QUERY,  function(err, rows, fields){
                               _.each(rows, function(item){
                                 student_detail[item.student_no][item.attendance] = item['count'];
                               });  
                              excel.excelgenerate(output_attendence,input.email,input.member_no,input.teacher_name,startdate,enddate,rows_classinfo[0].class_name,rows_classinfo[0].grade,req,res, student_detail); 
                              });    
                          });
                     }); 
                });
           }
      }
