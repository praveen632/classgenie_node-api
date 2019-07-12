var login = require('../models/login');
/**
 * Get the users list by criteria
 */
 module.exports.list = function (req, res){
 	  try{
 	  	   login.checkLogin(req, res);
       }
       catch(ex){}
 }
