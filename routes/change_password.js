var change_password = require('../models/change_password');
/**
  * Change password 
  * @params req, res
  */
 module.exports.save_edit = function (req, res){
 	 try{ 
     	  change_password.checkPassword(req, res);
     	}
       catch(ex){}
 }
