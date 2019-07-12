var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var sendmail = require('../common/sendmail');
var validator = require("email-validator");
var fs = require('fs');
module.exports = {
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      parentList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'parent_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.id != 'undefined'){
                   where += " AND id=? ";
                   data.push(query_str.id.trim());
               }
               if(typeof query_str.name != 'undefined'){
                   where += " AND name=? ";
                   data.push(query_str.name.trim());
                }
                if(typeof query_str.email != 'undefined'){
                   where += " AND email=? ";
                   data.push(query_str.email.trim());
                }
                if(typeof query_str.phone != 'undefined'){
                   where += " AND phone=? ";
                   data.push(query_str.phone.trim());
                }
                if(typeof query_str.email_not_in != 'undefined'){
                   where += " AND email<>? ";
                   data.push(query_str.email_not_in.trim());
                }                
               QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+"  AND `type` ='3' and status > '-1' ORDER BY id "+sort_by+" "+limit+" ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'parent_access');
                res.json(output);
          });
      },

       searchParent:function(req,res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'parent_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={};
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
               if(typeof query_str.member_no != 'undefined'){
                 where += " AND member_no like ? ";
                 data.push(query_str.member_no.trim()+"%");
             }
             if(typeof query_str.name != 'undefined'){
                 where += " AND name like ? ";
                 data.push(query_str.name.trim()+"%");
              }
             if(typeof query_str.email != 'undefined'){
                 where += " AND email like ? ";
                 data.push(query_str.email.trim()+"%");
              }
              QUERY = "SELECT * FROM "+config_constant.EDUSER+" "+where+" and status > '-1' ORDER BY id "+sort_by+" "+limit+" ";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                  }
                  output.timestamp = req.query.timestamp;
                  output.status = message.success;
                  output.comments = message.success;
                  output.user_list = rows;
                  mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'parent_access');
                  res.json(output);
            });
       }, 

      addParent:function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(_.extend(req.body, req.query))}, 'parent_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.name != 'undefined'){
                 SET += " name=?, ";
                 data.push(input.name.trim());
            }
            if(typeof input.email != 'undefined'){
                 SET += " email=?, ";
                 data.push(input.email.trim());
             }
             if(typeof input.password != 'undefined'){
                 SET += " password=?, ";
                 data.push(md5(input.password.trim()));
             }
             if(typeof input.phone != 'undefined'){
                 SET += " phone=?, ";
                 data.push(input.phone.trim());
             }
             SET = SET.trim().substring(0, SET.trim().length-1);
             QUERY = "SELECT email FROM "+config_constant.EDUSER+" WHERE email=? and status > '-1'";
             req.app.get('connection').query(QUERY, [input.email], function(err, rows, fields){
                if(err){
                   if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                  }else if(_.size(rows)>0){
                  res.json({'status':message.failure, 'comments':message.email_aready_exist});
                  return false;
                 }else{
                  SELECT = "SELECT member_no FROM "+config_constant.PARENTSEED+" where user_id ='' ORDER BY id ASC limit 1";
                     req.app.get('connection').query(SELECT, function(err, rows, fields){
                       if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{                          
                           result = rows[0];
                           QUERY = "INSERT INTO "+config_constant.EDUSER+" SET "+SET+", member_no="+result['member_no']+", type='3', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" '"; 
                           req.app.get('connection').query(QUERY, data, function(err, rows, result){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Inserting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                            SELECT = "SELECT * FROM "+config_constant.EDUSER+" where id ='"+rows.insertId+"' and status > '-1' ";
                            req.app.get('connection').query(SELECT, data, function(err, rows, result){
                           if(err){
                                if(config.debug){
                                    req.app.get('global').fclog("Error Selecting : %s ",err);
                                    res.json({error_code:1, error_msg:message.technical_error});
                                    return false;
                                  }
                               }else{
                                result = rows[0];
                                QUERY = "UPDATE "+config_constant.PARENTSEED+"  SET user_id ='"+result['id']+"', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+result['member_no']+"'";
                                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                                   if(err){
                                     if(config.debug){
                                        req.app.get('global').fclog("Error Updating : %s ",err);
                                        res.json({error_code:1, error_msg:message.technical_error});
                                        return false;
                                      }
                                   }
                                 });
                             sendmail.send({id:15, 'to':input.email,'member_no':result['member_no'],'name':input.name,'PROD_MAIL_USER':config_constant.PROD_MAIL_USER}); 
                              output.timestamp = req.query.timestamp;
                              output.status = message.success;
                              output.comments = message.success;
                              output.user_list = rows;
                              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'parent_access');
                              res.json(output);
                              }
                            });    
                           }
                         });
                        }
                      });
                    }
                 });
          },

/**
 * All the request of Student with put Method 
 *
 * @param req, res
 * @return response
 */
updateParent: function (req, res){
     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'parent/update_access');
     var data = [], output={};
     var SET = "";
     var input = JSON.parse(JSON.stringify(req.body));
     if(typeof input.name != 'undefined'){
           SET += " name=?, ";
           data.push(input.name.trim());
      } 
      if(typeof input.email != 'undefined'){
           SET += " email=?, ";
           data.push(input.email.trim());
      }  
      if(typeof input.member_no != 'undefined'){
          var img_name = 'img_'+input.member_no;    
       }    
      if(typeof input.image != 'undefined'){    
      var img = input.image;           
      var dataImage = img.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFile(config.upload_path+'/profile_image/'+img_name+'.jpg', dataImage, {encoding: 'base64'}, function(err){  
           });
            SET += " image=?, ";
            data.push(img_name+'.jpg');
          } 
      SET = SET.trim().substring(0, SET.trim().length-1);
      QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE member_no=? and status > '-1' ";
           req.app.get('connection').query(QUERY, input.member_no, function(err, rows, fields){
           if(err){
              if(config.debug){
                  req.app.get('global').fclog("Error Selecting : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
           }else{
              QUERY = "UPDATE "+config_constant.EDUSER+"  SET "+SET+", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
              req.app.get('connection').query(QUERY, data, function(err, rows, fields){
              if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Updating : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                  }else{
                       QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE member_no='"+input.member_no+"' and status > '-1' ";
                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{
                            output.timestamp = req.query.timestamp;
                            output.status = message.success;
                            output.comments = message.success;
                            output.user_list = rows;
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(output)}, 'parent/update_access');
                            res.json(output);
                          }
                       });
                    }
                });
           }
       });

},          

deleteParent: function (req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(_.extend(req.body, req.query))}, 'student_access');
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));
           if(typeof input.member_no != 'undefined'){
                 SET += " member_no=?, ";
                 data.push(input.member_no.trim());
            }
           SET = SET.trim().substring(0, SET.trim().length-1);
           QUERY = "UPDATE "+config_constant.EDUSER+" SET status = '-1', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE member_no='"+input.member_no+"'";
                       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                           if(config.debug){
                                req.app.get('global').fclog("Error Updating : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }             
                   else
                    {
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'student_access');
                      res.json(output);
                    }
                 });
           
      },

  checkparentcode:function(req, res){
     mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'PUT', text:serialize.serialize(_.extend(req.body, req.query))}, 'parent/update_access');
     var data = [], output={};
     var SET = "";
     var input = JSON.parse(JSON.stringify(req.body));
                if(typeof input.parent_no != 'undefined'){
                      SET += " parent_no=?, ";
                      data.push(input.parent_no.trim());
                } 
               if(typeof input.parent_ac_no != 'undefined'){
                      SET += " parent_ac_no=?, ";
                      data.push(input.parent_ac_no.trim());
                }
               SET = SET.trim().substring(0, SET.trim().length-1);
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE parent_no='"+input.parent_no+"' AND parent_ac_no = '0' ";
                   req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                      if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                   }else if(_.size(rows) > 0)
                     {
                     QUERY = "UPDATE "+config_constant.STUDENTINFO+"  SET parent_ac_no='"+input.parent_ac_no+"', request_status='-1', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE parent_no='"+input.parent_no+"'";
                     req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Updating : %s ",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                          }
                         }else{
                         QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+input.parent_ac_no+"'";
                         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                         }else{
                            output.timestamp = req.query.timestamp;
                            output.status = message.success;
                            output.comments = message.success;
                            output.student_list = rows;                           
                            res.json(output);
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'parent_access');
                          }
                       });
                    } 
                         });                     
                    }else{
                     res.json({'status':message.failure, 'comments':message.noresult});
                   }
                  
                 });
  },

       /**
       * Display listing of parent kids.
       *
       * @param req, res
       * @return response
       */
      KidsList: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'parent/kidslist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={}, class_id = [], class_name = [];
              var where = " WHERE 1=1 ";
              var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
              var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
              if(typeof query_str.parent_ac_no != 'undefined'){
                   where += " AND parent_ac_no=? ";
                   data.push(query_str.parent_ac_no.trim());
               }
               QUERY = "SELECT name, image, class_id, parent_ac_no, student_no FROM "+config_constant.STUDENTINFO+" "+where+" ORDER BY parent_ac_no "+sort_by+" "+limit+" ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                  if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                }
                  output.student_list = [];
                _.each(rows, function(item){
                  output.student_list.push(item);
                 if(class_id != '0'){
                  class_id += ','+ "'"+item.class_id + "'";
                 }
                });
                 if(class_id != ''){
                  class_id = class_id.substring(1);
                 }
                 var item_node = {};
                 QUERY = "SELECT class_name,class_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+")";
                 req.app.get('connection').query(QUERY, function(err, rows, fields){
                            _.each(rows, function(item, index){
                            item_node[item.class_id] = item.class_name;
                          });
                          _.each(output.student_list, function(item, index){
                           if(typeof item_node[item.class_id] != 'undefined'){
                                output.student_list[index]['class_name'] = item_node[item.class_id];
                            }
                        });
                          res.json(output);
                });              
             });
      },
       /**
       * Remove kids.
       *
       * @param req, res
       * @return response
       */
      kidRemove: function(req, res){
        mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'parent/kidremove_access');
         var input = JSON.parse(JSON.stringify(req.body));
        var data = [], output={};
        var where = " WHERE 1=1 ";
        var limit = (typeof input.start_record_index != 'undefined' && typeof input.page_size != 'undefined' && input.start_record_index>-1 && input.page_size != '') ? " LIMIT "+input.start_record_index+" ,"+input.page_size:" LIMIT 0,"+req.app.get('config').page_size;
        var sort_by = (typeof input.sort_by != 'undefined' && input.sort_by=='A' ? " asc ":" desc ");
            if(typeof input.student_no != 'undefined'){
                   where += " AND student_no=? ";
                   data.push(input.student_no.trim());
               }
               QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+" ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                 if(config.debug){
                      req.app.get('global').fclog("Error Selecting : %s ",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                    }
                 }
                 else if(_.size(rows) > 0){
                      QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET parent_ac_no = '0', updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE student_no = '"+input.student_no+"' ";
                      req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                        if(err){
                          if(config.debug){
                              req.app.get('global').fclog("Error Updating : %s ",err);
                              res.json({error_code:1, error_msg:message.technical_error});
                              return false;
                            }
                        }else{
                          QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" "+where+" ";
                          req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                           }else{
                            output.timestamp = req.query.timestamp;
                            output.status = message.success;
                            output.comments = message.success;
                            output.user_list = rows;                           
                            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'DELETE', text:serialize.serialize(output)}, 'parent/kidremove_access');
                            res.json(output);
                           }
                          });
                        }
                      });
                 }else{
                  res.json({'status':message.failure, 'comments':message.noresult});
                 }
               });
      }
    }
      
