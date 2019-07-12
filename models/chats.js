var _ = require('underscore');
var url = require('url');
var config = require('../common/config');
var _global = require('../common/global');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var _ = require('underscore');
var mongo_connection = require('../common/mongo_connection');
var config_constant = require('../common/config_constant');
var fs = require('fs');
module.exports = {
	list: function(req, res){   	 
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var where = " WHERE 1=1 ";
		  var page_size = req.app.get('config').page_size;
          var start_record_index = (query_str.page_size - 1) *page_size;
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
          var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
          if(typeof query_str.teacher_id != 'undefined'){               
				where += " AND teacher_id=? ";
                data.push(query_str.teacher_id.trim());
            }
	      if(typeof query_str.parent_id != 'undefined'){
	        if(query_str.parent_id.indexOf(',')>-1){
			    where += " AND receiver_class_id=? ";
                data.push(query_str.class_id.trim());			   
			 }
			else
			{
               
			   where += " AND parent_id=? ";
               data.push(query_str.parent_id.trim());
			   where += " AND receiver_class_id=? ";
               data.push(query_str.class_id.trim());
			}
	      }		  
		  	QUERY = "SELECT * FROM "+config_constant.CHAT+" "+where+" ORDER BY id DESC "+limit+"  ";
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
                res.json(output);
          });
    },

    save: function(req,res){
           var data = [], output={};
           var SET = "";
           var input = JSON.parse(JSON.stringify(req.body));          
           if(typeof input.teacher_id != 'undefined'){
                 SET += " teacher_id=?, ";
                 data.push(input.teacher_id.trim());
             }
             if(typeof input.parent_id != 'undefined'){
                 SET += " parent_id=?, ";
                 data.push(input.parent_id.trim());
             }             
             if(typeof input.message != 'undefined'){
                 SET += " message=?, ";
                 data.push(input.message.trim());
             }
             if(typeof input.sender_name != 'undefined'){
                 SET += " sender_name=?, ";
                 data.push(input.sender_name.trim());
             }
             if(typeof input.receiver_name != 'undefined'){
                 SET += " receiver_name=?, ";
                 data.push(input.receiver_name.trim());
             }             
             if(typeof input.sender_ac_no != 'undefined'){
                 SET += " sender_ac_no=?, ";
                 data.push(input.sender_ac_no.trim());
             }
             if(typeof input.receiver_ac_no != 'undefined'){
                 SET += " receiver_ac_no=?, ";
                 data.push(input.receiver_ac_no.trim());
             }             
             if(typeof input.class_id != 'undefined'){
                 SET += " receiver_class_id=?, ";
                 data.push(input.class_id.trim());
             }
             
           if(typeof req.file != 'undefined'){ 
				  var file = req.file;
				  var name = file.originalname.split('.');
				  if(file.size>20*1024*1024){
					 fs.unlinkSync(file.path);
					 res.json({err:'File greater than 20mb is not allowed'});
					 return false;
				  }
				  if(name[1] == 'mp4' || name[1] == '3gp' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'png' ){
				        var media_name = _global.getTimeStamp()+Math.floor((Math.random()*100)+1)+'.'+name[0]+'.'+name[1];
                         var data = fs.readFileSync(file.path);
						  fs.writeFile(config.upload_path+'/chat/'+media_name, data, function(err){
			                if (err) {
			                    res.json({err:'Input File Error'});
			                    return false;
			                 }
			               if(fs.existsSync(file.path)) {
			                  fs.unlinkSync(file.path);
			               }
						   
						 var message_name = ((name[1] == 'mp4') || (name[1] == '3gp') ? 'video#$#'+media_name : 'image#$#'+media_name );
						   QUERY = "INSERT INTO "+config_constant.CHAT+" SET message='"+message_name+"', teacher_id='"+input.teacher_id+"',parent_id='"+input.parent_id+"',sender_name='"+input.sender_name+"',receiver_name='"+input.receiver_name+"',sender_ac_no='"+input.sender_ac_no+"',receiver_ac_no='"+input.receiver_ac_no+"',receiver_class_id='"+input.class_id+"',  receiver_read='0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' "; 
						   req.app.get('connection').query(QUERY, function(err, rows, result){
						   if(err){
							if(config.debug){
								req.app.get('global').fclog("Error Inserting1 : %s ",err);
								res.json({error_code:1, error_msg:message.technical_error});
								return false;
							  }
							}
						});
				  });
				}		 
				  else
				  {
					  res.json({err:'Invalid file format!'});
					  return false;
				  }
			}else if(input.receiver_ac_no.indexOf(',')>-1){
				 
			 	  //Insert teacher into collection
			 	  QUERY = "INSERT INTO "+config_constant.CHAT+" SET "+SET+" receiver_read='0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' "; 
                           req.app.get('connection').query(QUERY, data, function(err, rows, result){
                           if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Inserting1 : %s ",err);
                                res.json({error_code:1, error_msg:message.technical_error});
                                return false;
                              }
                            }
                        });
	                   //Insert each parent into collection
					        /*var receiver_names = input.receiver_name.split(',');
							var parent_ids = input.parent_id.split(',');
						    input.receiver_ac_no.split(",").forEach(function (item, index) { 
						    	 QUERY = "INSERT INTO "+config_constant.CHAT+" SET teacher_id ='"+input.teacher_id+"',parent_id ='"+parent_ids[index]+"',message ='"+input.message+"', sender_name ='"+input.sender_name+"',receiver_name ='"+receiver_names[index]+"', sender_ac_no ='"+input.sender_ac_no+"', receiver_ac_no ='"+item+"', class_id ='"+input.class_id+"', receiver_read='0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' "; 
                                 req.app.get('connection').query(QUERY, data, function(err, rows, result){								 
									  if (err) {
										  if(config.debug){
						                      req.app.get('global').fclog("Error on connection",err);
						                      res.json({error_code:1, error_msg:message.technical_error});
						                      return false;
						                  }
									   }
								  });
							});*/
			 }else{
				
                   QUERY = "INSERT INTO "+config_constant.CHAT+" SET "+SET+" receiver_read='0', created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' "; 
	               req.app.get('connection').query(QUERY, data, function(err, rows, result){
	               if(err){
	                if(config.debug){
	                    req.app.get('global').fclog("Error Inserting1 : %s ",err);
	                    res.json({error_code:1, error_msg:message.technical_error});
	                    return false;
	                  }
	                }
	            });
			 }

			 // QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no IN ("+input.sender_ac_no+") and status = 1";
				// 		req.app.get('connection').query(QUERY, function(err, rows_sender, fields){
				// 			if(err){
				// 			   if(config.debug){
				//                       req.app.get('global').fclog("Error in Selecting1 : %s",err);
				//                       res.json({error_code:1, error_msg:message.technical_error});
				//                       return false;
				//                   }
				// 			}else{
    //                       device_id = [];
    //                       _.each(rows_sender, function(item){
    //                       if(item.device_id != 0){
    //                           device_id += ','+"'"+item.device_id+"'";
    //                           }
    //                         });
    //                        if(device_id != ''){
    //                         device_id = device_id.substring(1);
    //                        }	
							
						 
				// 		//Send notification in case of multiple insert message
				// 		QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+input.receiver_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";
				// 		req.app.get('connection').query(QUERY, function(err, rows, fields){
				// 			if(err){
				// 			   if(config.debug){
				//                       req.app.get('global').fclog("Error in Selecting2 : %s",err);
				//                       res.json({error_code:1, error_msg:message.technical_error});
				//                       return false;
				//                   }
				// 			}
				// 			if(input.message.indexOf('png')>-1 || input.message.indexOf('gif')>-1 || input.message.indexOf('jpg')>-1 || input.message.indexOf('mp4')>-1 || input.message.indexOf('3gp')>-1){
				// 			   input.message = "New message from Classgenie";
				// 			}
				// 			input.message = _global.cutString(input.message, 30)+'..';
				// 			_.each(rows, function(item){
				// 			   if (config.env === 'production'){
				// 				  _global.pushNotification({module_id:3, message:input.message, title:'Classgenie-Message', device_id:item.device_id, class_id:"", member_no:item.member_no});
				// 				}
				// 			});
				// 		  });
				// 		 } //end else if
				// 		}); //end select device id for sender_ac_no 

						res.json({message:'1'});

    },
    update:function(req,res){
		var data = [], output={};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
		QUERY = "UPDATE "+config_constant.CHAT+" SET receiver_read ='1' WHERE receiver_ac_no='"+input.member_no+"' AND sender_ac_no='"+input.sender_ac_no+"' AND receiver_read='0' AND receiver_class_id='"+input.class_id+"' ";
        req.app.get('connection').query(QUERY, function(err, rows, fields){
           if(err){
              if(config.debug){
                  req.app.get('global').fclog("Error Updating : %s ",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
           }
            res.json({message:'1'});
        });
    },

     remove:function(req,res){
        var input = JSON.parse(JSON.stringify(req.body));
        QUERY = "DELETE FROM "+config_constant.CHAT+" WHERE id = '"+input.id+"' ";
        req.app.get('connection').query(QUERY, function(err, rows, fields){
	         if(err){
	          if(config.debug){
	             req.app.get('global').fclog("Error Deleting : %s ",err);
	             res.json({error_code:1, error_msg:message.technical_error});
	             return false;
	          }
	         }
	         if(input.message.split('.')[1]){
			    if (input.message.indexOf('emotion_image')<0){
				    var msg = input.message.split('#$#');
					if(fs.existsSync(config.upload_path+'/chat/'+msg[1])){
					   fs.unlinkSync(config.upload_path+'/chat/'+msg[1]);
					}
				}
			 }
	     });
	     //Send notification in case of remove message
		  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+input.receiver_ac_no+") and status = 1";
		  req.app.get('connection').query(QUERY, function(err, rows, fields){
				if(err){
				   if(config.debug){
	                      req.app.get('global').fclog("Error in Selecting",err);
	                      res.json({error_code:1, error_msg:message.technical_error});
	                      return false;
	                  }
				}
				_.each(rows, function(item){
				   if (config.env === 'production'){
					  _global.pushNotification({module_id:3, message:"Remove message from Classgenie..", title:'Classgenie-Message', device_id:item.device_id, class_id:"", member_no:item.member_no});
				    }
			    });
		  });

		  res.json({message:'1'});	    
    },

    chat_notification: function(req, res){
          var query_str = url.parse(req.url,true).query;
          var data = [], output={};
          var where = " WHERE 1=1 ";
          var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index>-1 && query_str.page_size != '') ? " LIMIT "+query_str.start_record_index+" ,"+query_str.page_size:" LIMIT 0,"+req.app.get('config').page_size;
          var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
          if(typeof query_str.receiver_ac_no != 'undefined'){
                where += " AND receiver_ac_no=? ";
                data.push(query_str.receiver_ac_no.trim());
          }
          if(typeof query_str.notification_sender_ac_no != 'undefined'){
		      var notification_sender_ac_no = [];
			  query_str.notification_sender_ac_no.split(",").forEach(function (item, index) {
			     notification_sender_ac_no.push(item);
			  });
		         where += " AND sender_ac_no=? ";
                data.push(notification_sender_ac_no);
          }
          QUERY = "SELECT * FROM "+config_constant.CHAT+" "+where+" ORDER BY id "+sort_by+"";
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
                res.json(output);
          });
    }
}