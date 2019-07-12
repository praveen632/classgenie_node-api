var users = require('../models/users');
var _global = require('../common/global');

/**
 * Get the users list by criteria
 */
 module.exports.list = function (req, res){
 	  try{ console.log(1);
		   console.log(_global.testNotification());
 	  	  // users.listUsers(req, res);
       }
       catch(ex){}
 }

 /**
  *  Get the users list for sarching
  */
 module.exports.search = function (req, res){
 	  try{
      		users.searchUsers(req, res);
      	}
      	catch(ex){}
 }

 /**
  * Add user 
  * @params req, res
  */
 module.exports.save = function (req, res){
 	 try{ 
     	  users.saveUser(req, res);
     	}
       catch(ex){}
 }

  /**
  * Update user 
  * @params req, res
  */
 module.exports.save_edit = function (req, res){
 	 try{ 
     	  users.updateUser(req, res);
     	}
       catch(ex){}
 }

  /**
  * Delete user 
  * @params req, res
  */
 module.exports.delete = function (req, res){
 	 try{ 
     	  users.deleteUser(req, res);
     	}
       catch(ex){}
 }


  /**
  * update school 
  * @params req, res
  */

