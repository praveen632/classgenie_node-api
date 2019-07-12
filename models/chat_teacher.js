var _ = require('underscore');
var url = require('url');
var mongo_connection = require('../common/mongo_connection');
var config = require('../common/config');
var _global = require('../common/global');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var _ = require('underscore');
var config_constant = require('../common/config_constant');
var fs = require('fs');
var filename = 'chat_message';
module.exports = {
   save:function(req,res){
          var input = JSON.parse(JSON.stringify(req.body));
          var MongoClient = require('mongodb').MongoClient;
          MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
				 if(err){
					if(config.debug){
                      req.app.get('global').fclog("Error on connection",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                  }
				 }
			     if(typeof req.file != 'undefined'){ 
						  var file = req.file;
						  var name = file.originalname.split('.');
						  if(file.size>20*1024*1024){
							 fs.unlinkSync(file.path);
							 res.json({err:'File greater than 20mb is not allowed'});
							 return false;
						  }
						  if(_.contains(['png', 'gif', 'jpg', 'mp4', '3gp'], name[1])){
						        name[1] = (_.contains(['mp4', '3gp'], name[1]) ? "mp4" : name[1]); 
								var data = fs.readFileSync(file.path);			  
								var media_name = _global.getTimeStamp()+Math.floor((Math.random()*100)+1)+'.'+name[1];
								fs.writeFile(config.upload_path+'/chat/'+media_name, data);
								fs.unlinkSync(file.path);
								input.message = (_.contains(['mp4', '3gp'], name[1]) ? 'video#$#'+media_name : 'image#$#'+media_name);
						  }
						  else
						  {
							  res.json({err:'Invalid file format!'});
							  return false;
						  }
					}
			        if(_.contains(config.mongo_allow_collection, filename)){
						 myCollection = db.collection(filename+'.log');
        				  if(input.receiver_ac_no.indexOf(',')>-1){
        					   //Insert teacher into collection
							   var object_id = new require('mongodb').ObjectID();
        					    myCollection.insert({"_id": object_id, teacher_id:input.teacher_id , parent_id:input.parent_id, message:input.message, created_at:_global.getTimeStamp(), sender_name: input.sender_name, receiver_name:input.receiver_name, sender_ac_no:input.sender_ac_no, receiver_ac_no:input.receiver_ac_no, class_id:input.class_id, source_init:input.source_init, message_date:_global.js_yyyy_mm_dd_hh_mm_ss()}, function(err, result) {
        					      if(err){
        						     if(config.debug){
					                      req.app.get('global').fclog("Error on connection",err);
					                      res.json({error_code:1, error_msg:message.technical_error}); 
					                      return false;
					                  }
        					       }
        					   });
        						//Insert each parent into collection
        				        var receiver_names = input.receiver_name.split(',');
        						var parent_ids = input.parent_id.split(',');
        					    input.receiver_ac_no.split(",").forEach(function (item, index) { 
        							  myCollection.insert({"_id": new require('mongodb').ObjectID(), "sender_object_id": object_id ,teacher_id:input.teacher_id , parent_id:parent_ids[index], message:input.message, created_at:_global.getTimeStamp(), sender_name: input.sender_name, receiver_name:receiver_names[index], sender_ac_no:input.sender_ac_no, receiver_ac_no:item, receiver_read:0, receiver_class_id:input.class_id, source_init:input.source_init, message_date:_global.js_yyyy_mm_dd_hh_mm_ss()}, function(err, result) {
										  if (err) {
											  if(config.debug){
							                      req.app.get('global').fclog("Error on connection",err);
							                      res.json({error_code:1, error_msg:message.technical_error});
							                      return false;
							                  }
										   }
        							  });
        						});
        				  }
        				  else
        				  {
        					myCollection.insert({"_id": new require('mongodb').ObjectID(), teacher_id:input.teacher_id , parent_id:input.parent_id, message:input.message, created_at:_global.getTimeStamp(), sender_name: input.sender_name, receiver_name:input.receiver_name, sender_ac_no:input.sender_ac_no, receiver_ac_no:input.receiver_ac_no, receiver_read:0, receiver_class_id:input.class_id, source_init:input.source_init, message_date:_global.js_yyyy_mm_dd_hh_mm_ss()}, function(err, result) {
        					  if (err) {
        						 if(config.debug){
				                      req.app.get('global').fclog("Error on connection",err);
				                      res.json({error_code:1, error_msg:message.technical_error});
				                      return false;
				                  }
        					   }
        					});
        				 }
						 
						 // select device id for input.sender_ac_no
						 QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no IN ("+input.sender_ac_no+") and status = 1";
						req.app.get('connection').query(QUERY, function(err, rows_sender, fields){
							if(err){
							   if(config.debug){
				                      req.app.get('global').fclog("Error in Selecting : %s",err);
				                      res.json({error_code:1, error_msg:message.technical_error});
				                      return false;
				                  }
							}else{
                          device_id = [];
                          _.each(rows_sender, function(item){
                          if(item.device_id != 0){
                              device_id += ','+"'"+item.device_id+"'";
                              }
                            });
                           if(device_id != ''){
                            device_id = device_id.substring(1);
                           }	
							
						 
						//Send notification in case of multiple insert message
						QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+input.receiver_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";
						req.app.get('connection').query(QUERY, function(err, rows, fields){
							if(err){
							   if(config.debug){
				                      req.app.get('global').fclog("Error in Selecting : %s",err);
				                      res.json({error_code:1, error_msg:message.technical_error});
				                      return false;
				                  }
							}
							if(input.message.indexOf('png')>-1 || input.message.indexOf('gif')>-1 || input.message.indexOf('jpg')>-1 || input.message.indexOf('mp4')>-1 || input.message.indexOf('3gp')>-1){
							   input.message = "New message from Classgenie";
							}
							input.message = _global.cutString(input.message, 30)+'..';
							_.each(rows, function(item){
							   if (config.env === 'production'){
								  _global.pushNotification({module_id:3, message:input.message, title:'Classgenie-Message', device_id:item.device_id, class_id:"", member_no:item.member_no});
								}
							});
						  });
						 } //end else if
						}); //end select device id for sender_ac_no 

						res.json({message:'1'});
                 } 
          });
   },
   list: function(req, res){
        var query_str = url.parse(req.url,true).query;
		var page_number = (typeof query_str.page_number == 'undefined' ? 1 : query_str.page_number);
		var page_limit = 20;
        var MongoClient = require('mongodb').MongoClient;
        var obj_where = {};
        MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
              if(err) {
                if(config.debug){
                      req.app.get('global').fclog("Error on connection",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                  }
              }
              if(_.contains(config.mongo_allow_collection, filename)){
                  if(typeof query_str.teacher_id != 'undefined'){
                        obj_where.teacher_id = query_str.teacher_id;
                  }
                  if(typeof query_str.parent_id != 'undefined'){
				        if(query_str.parent_id.indexOf(',')>-1){
						    obj_where.class_id = query_str.class_id;
						 }
						else
						{
                           obj_where.parent_id = query_str.parent_id;
						   obj_where.receiver_class_id = query_str.class_id;
						}
                  }
				  if(typeof query_str.source_init != 'undefined'){
                        obj_where.source_init = query_str.source_init;
                  }
                  myCollection = db.collection(filename+'.log');
                  myCollection.find(obj_where, {
						"limit": page_limit,
						"skip": page_limit * (page_number - 1),
						"sort": [['_id', -1]]
                     }).toArray(function(err, documents) {
                        if(err) {
                          if(config.debug){
		                      req.app.get('global').fclog("Error on connection",err);
		                      res.json({error_code:1, error_msg:message.technical_error});
		                      return false;
		                  }
                        }
                        res.json(documents.reverse());
                  });
              }
          });
   },
   chat_notification: function(req, res){
        var query_str = url.parse(req.url,true).query;
        var MongoClient = require('mongodb').MongoClient;
        var obj_where = {receiver_read:0};
        MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
              if(err) {
                if(config.debug){
                      req.app.get('global').fclog("Error on connection",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                  }
              }
              if(_.contains(config.mongo_allow_collection, filename)){
                  if(typeof query_str.receiver_ac_no != 'undefined'){
                        obj_where.receiver_ac_no = query_str.receiver_ac_no;
                  }
                  if(typeof query_str.notification_sender_ac_no != 'undefined'){
				      var notification_sender_ac_no = [];
					  query_str.notification_sender_ac_no.split(",").forEach(function (item, index) {
					     notification_sender_ac_no.push(item);
					  });
				      obj_where.sender_ac_no = {$in:notification_sender_ac_no}
                  }
                  myCollection = db.collection(filename+'.log');
                  myCollection.find(obj_where, {
                        "sort": [['_id', 1]]
                     }).toArray(function(err, documents) {
                        if(err) {
                          if(config.debug){
                            req.app.get('global').fclog("Error on connection",err);
                            res.json({error_code:1, error_msg:message.technical_error});
                            return false;
                        }
                    }
                        res.json(documents);
                  });
              }
          });
    },
	update:function(req,res){
        var input = JSON.parse(JSON.stringify(req.body));
        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
              if(err) {
                if(config.debug){
                      req.app.get('global').fclog("Error on connection",err);
                      res.json({error_code:1, error_msg:message.technical_error});
                      return false;
                  }
              }
              if(_.contains(config.mongo_allow_collection, filename)){
                  myCollection = db.collection(filename+'.log');
				  myCollection.update({"receiver_ac_no":input.member_no, "sender_ac_no":input.sender_ac_no, "receiver_read":0, "receiver_class_id":input.class_id}, {$set:{"receiver_read":1}}, {multi:true}, function(err, result) {
					  if (err) {
						  if(config.debug){
		                      req.app.get('global').fclog("Error on connection",err);
		                      res.json({error_code:1, error_msg:message.technical_error});
		                      return false;
		                  }
					   }
					   res.json({message:'1'});
				  });
              }
        });
   },
   remove:function(req,res){
        var input = JSON.parse(JSON.stringify(req.body));
        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
		     if(err) {
                _global.fclog('Error on connection'+err);
             }
			 if(_.contains(config.mongo_allow_collection, filename)){
                  myCollection = db.collection(filename+'.log');
				  //Check remove request is comming from all the parent, Its remove child documents
				  if(input.receiver_ac_no.indexOf(',')>-1){
				     myCollection.remove({"sender_object_id": new require('mongodb').ObjectID(input.objectid)}, function(err, object) {
					     if(err){
							 if(config.debug){
			                      req.app.get('global').fclog("Error on connection",err);
			                      res.json({error_code:1, error_msg:message.technical_error});
			                      return false;
			                  }
						  }
					  });					 
				  }
				  //Default case to remove original document
				  myCollection.remove({"_id": new require('mongodb').ObjectID(input.objectid)}, function(err, object){
					 if(err) {
						if(config.debug){
		                      req.app.get('global').fclog("Error in deleting",err);
		                      res.json({error_code:1, error_msg:message.technical_error});
		                      return false;
		                  }
					 }
					 if(_.contains(['png', 'gif', 'jpg', 'mp4', '3gp'], input.message.split('.')[1])){
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
			  }
		});
   }
}