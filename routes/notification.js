var notification = require('../models/notification');
/**
 * Push notification
 */
 module.exports.pushnotification = function(req, res){
  	try{
 		notification.pushnotification(req, res);
 	}
 	catch(ex){}
 }

 module.exports.getnotification = function(req, res){
  	try{
 		notification.getnotification(req, res);
 	}
 	catch(ex){}
 }