var upload_data = require('../models/upload_data');
/**
 * Post image/video to upload
 */
 module.exports.upload = function (req, res){
 	  try{
 	  	    upload_data.upload(req, res);
       }
       catch(ex){}
 }
 /**
 * Update image/video to upload
 */
 module.exports.upload_update = function (req, res){
 	  try{
 	  	    upload_data.upload_update(req, res);
       }
       catch(ex){}
 }
