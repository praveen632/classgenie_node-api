/**
 * Common mongodb connection class
 */
 var mongo = require('mongodb');
 var ip = require('ip');
 var config = require('./config');
 var _global = require('./global');
 var _ = require('underscore'); 
 module.exports = {
 	 save:function(obj, filename){
 	 	var MongoClient = require('mongodb').MongoClient;
 	 	config.mongo_database = (config.env == 'development' ? config.mongo_staging_database : config.mongo_database);
	    MongoClient.connect("mongodb://"+config.mongo_user+":"+config.mongo_password+"@"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_database+"", function(err, db, objdb) {
	          if (err) {
			    _global.fclog('Error on connection'+err);
			  }
			  if(_.contains(config.mongo_allow_collection, filename)){
				  myCollection = db.collection(filename+'.log');
				  myCollection.insert({"_id": new require('mongodb').ObjectID(), SOURCE:'node', SERVER_IP: ip.address(), REQUEST_TIME: _global.js_yyyy_mm_dd_hh_mm_ss(), REQUEST_IP: obj.request_ip, REQUEST_URI: obj.request_url, REQUEST_METHOD:obj.request_method, TEXT:obj.text}, function(err, result) {
				    if (err) {
				      _global.fclog('Error on connection'+err);
				     }
				  });
			  }
	    });
        
	}
  }
 