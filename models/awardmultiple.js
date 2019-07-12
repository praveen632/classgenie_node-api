var _ = require('underscore');
var url = require('url');
var fs = require('fs');
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
       awardClass:function (req, res){
      	      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(req.query)}, 'awardmultiple_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};var stu_list = [];var class_info =[];var data_input=[];
              var where = " WHERE 1=1 ";
              var SET ="";
              var data_input = JSON.parse(JSON.stringify(req.body));
              var input = JSON.parse(data_input['data']);
              var stu_id="";
              stu_id=input['id'];  
              for(var i=0;i< _.size(input['id']);i++){ 
                 	QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET pointweight= `pointweight` + '"+input['pointweight']+"', updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE class_id='"+input['class_id']+"'AND id='"+input['id'][i]+"'";
                  req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                       });         
                       QUERY = "UPDATE "+config_constant.CLASSINFO+" SET pointweight= `pointweight` + '"+input['pointweight']+"', updated_at="+" ' "+_global.js_yyyy_mm_dd()+" ' WHERE class_id='"+input['class_id']+"'";
                       req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }
                      });
					            QUERY="SELECT student_no from "+config_constant.STUDENTINFO+"  where id = '"+input['id'][i]+"'";
                          req.app.get('connection').query(QUERY,function(err,rows_student_no,fields){
                            if(err){
                              if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                            }
                            QUERY = "INSERT INTO "+config_constant.STUDENTINFO_POINT+" SET class_id='"+input.class_id+"', student_info_no='"+rows_student_no[0]['student_no']+"', point='"+input.pointweight+"', customize_skills_id='"+input.customize_skills_id+"', created_at=" +" ' "+_global.js_yyyy_mm_dd()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd()+" '"; 
                            req.app.get('connection').query(QUERY, function(err, rows_student_info, fields){
                            if(err){
                                if(config.debug){
                                     req.app.get('global').fclog("Error Inserting : %s ",err);
                                     res.json({error_code:1, error_msg:message.technical_error});
                                     return false;
                                   }
                                 }
                               });
                          });
                        }
                        QUERY="SELECT * from "+config_constant.CLASSINFO+"  where class_id = '"+input['class_id']+"'";
                        req.app.get('connection').query(QUERY,function(err,rows,fields){
                          if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                          }
                                class_info = rows;
                          }); 
                      	  QUERY="SELECT * from "+config_constant.STUDENTINFO+"  where id in ("+stu_id+")";
                       	  req.app.get('connection').query(QUERY,function(err,rows,fields){
                       		   if(err){
                       			    if(config.debug){
                                     req.app.get('global').fclog("Error Selecting : %s ",err);
                                     res.json({error_code:1, error_msg:message.technical_error});
                                     return false;
                                   }
                                }
                                output.status = message.success;
                                output.comments = message.success;
                                output.class_info = class_info;
                                output.student_list = rows;
                                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'awardmultiple_access');
                                res.json(output);                                                 
                            });
                        }
                      }