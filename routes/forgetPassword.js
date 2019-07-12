var fargetPassword = require('../models/forgetPassword');
/**
 * Forget Password 
 */
 module.exports.forgetPassword = function(req, res){
  	try{
 		fargetPassword.forgetPassword(req, res);
 	}
 	catch(ex){}
 }
