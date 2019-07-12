var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var sendmail = require('../common/sendmail');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var fs = require('fs');
module.exports = {
	wp_user:function(req,res,name,email,password,member_no,usertype){
			var data = {};
		    QUERY = "SELECT user_email FROM "+config_constant.WPUSERS+" WHERE  user_email=? and user_status > '-1' ";
		     req.app.get('wp_connection').query(QUERY, [email], function(err, rows, fields){
		       if(err){
		           if(config.debug){
		                req.app.get('global').fclog("Error Selecting : %s ",err);
		                res.json({error_code:1, error_msg:message.technical_error});
		                return false;
		              }
		         }
		         else if(_.size(rows)>0){
		           res.json({'status':message.failure, 'comments':message.email_aready_exist});
		           return false;
		         }                                     
		         QUERY = "INSERT INTO "+config_constant.WPUSERS+" SET id ='"+member_no+"', user_login = '"+email+"', user_email = '"+email+"', user_nicename ='"+name+"', display_name = '"+name+"', user_pass = '"+md5(password.trim())+"', user_registered="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";
		         req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
		          if(err){
		            if(config.debug){
		              req.app.get('global').fclog("Error in Inserting : %s",err);
		              res.json({error_code:1, error_msg:message.technical_error});
		              return false;
		            }
		          } 
		        });
		        // Insert data in word press usermeta data table
		        if(usertype == 1){
		           var meta_value = 'a:1:{s:6:"editor";b:1;}';
		        }else if(usertype == 2){
                    var meta_value = 'a:1:{s:6:"author";b:1;}';
		        }
		        QUERY = "INSERT INTO "+config_constant.WPUSERSMETA+" SET user_id = '"+member_no+"', meta_key = 'wp_capabilities', meta_value = '"+meta_value+"' ";
		        req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
		          if(err){
		            if(config.debug){
		              req.app.get('global').fclog("Error in Inserting :%s",err);
		              res.json({error_code:1, error_msg:message.technical_error});
		              return false;
		            }
		          }        
		        });
		       });
		},

		wp_school:function(req, res, member_no, school_id){
			var data ={};
			QUERY = "SELECT object_id FROM "+config_constant.WPUAMACCESSOBJ+" WHERE object_id = '"+member_no+"' ";
			req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
				if(err){
                	if(config.debug){
                		req.app.get('global').fclog("Error in Selecting: %s",err);
                		res.json({error_code:1, error_msg:message.technical_error});
		                return false;
                	}
                }else if(_.size(rows) > 0){
                	QUERY = "UPDATE "+config_constant.WPUAMACCESSOBJ+" SET group_id = '"+school_id+"' WHERE object_id = '"+member_no+"' ";
                	req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
                       if(err){
                       	if(config.debug){
                       		req.app.get('global').fclog("Error in Updating: %s",err);
                            res.json({error_code:1, error_msg:message.technical_error});
				            return false;   
                       	}
                       }                       	
			         }); 
                       }else{
                        QUERY = "INSERT INTO "+config_constant.WPUAMACCESSOBJ+" SET object_id = '"+member_no+"', group_id = '"+school_id+"', object_type = 'user' ";
						req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
			                if(err){
			                	if(config.debug){
			                		req.app.get('global').fclog("Error in Inserting: %s",err);
			                		res.json({error_code:1, error_msg:message.technical_error});
					                return false;
			                	}
			                }
					});			
                }
			});
		},

       //Wordpress update
		wp_update: function(req, res, member_no, name, password, email){
		   var data = {};        
           QUERY ="UPDATE "+config_constant.WPUSERS+" SET user_login = '"+email+"', user_email = '"+email+"', user_nicename ='"+name+"', display_name = '"+name+"', user_pass = '"+md5(password.trim())+"', user_registered="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' WHERE ID ='"+member_no+"' ";
           req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
               if(err){
                if(config.debug){
                  req.app.get('global').fclog("Error in Updating :%s",err);
                  res.json({error_code:1, error_msg:message.technical_error});
                  return false;
                }
               }
           });
		},

        //delete data from wordpress
		wp_delete: function(req, res, member_no){
			var data = {};
            QUERY = "DELETE FROM "+config_constant.WPUSERS+" WHERE id='"+member_no+"' ";
            req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                	if(config.debug){
                		req.app.get('global').fclog("Error in Deleting: %s",err);
                		res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                	}
                }else{
                	QUERY = "DELETE FROM "+config_constant.WPUSERSMETA+" WHERE user_id='"+member_no+"' ";
		            req.app.get('wp_connection').query(QUERY, data, function(err, rows, fields){
		                if(err){
		                	if(config.debug){
		                		req.app.get('global').fclog("Error in Deleting: %s",err);
		                		res.json({error_code:1, error_msg:message.technical_error});
		                        return false;
		                	}
		                }
		            });
                }
            });
		}		
}