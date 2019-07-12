//var sendmail = require('../common/sendmail');
var sendmail = require('../models/sendmail');
/**
 * Send mail.
 */
 module.exports.sendmail = function (req, res){     
	try{
 	  	   sendmail.sendmail(req, res);
       }
    	   catch(ex){}
 	}