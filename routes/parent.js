var parent = require('../models/parent');
/**
 * Get the Parent list by criteria
 */
 module.exports.list = function (req, res){
 	  try{
 	  	   parent.parentList(req, res);
       }
       catch(ex){}
 }

 /**
  *  Search the Parent information
  */
 module.exports.search = function (req, res){
 	  try{
      		parent.searchParent(req, res);
      	}
      	catch(ex){}
 }

 /**
  * Add Parent Detail
  * @params req, res
  */
 module.exports.save = function (req, res){
 	 try{ 
     	  parent.addParent(req, res);
     	}
       catch(ex){}
 }
 /**
  * Check parent code
  * @params req, res
  */
  module.exports.checkcode = function (req, res){
   try{ 
        parent.checkparentcode(req, res);
      }
       catch(ex){}
 }
 /**
  * update Parent Detail
  * @params req, res
  */
 module.exports.update = function (req, res){
   try{ 
        parent.updateParent(req, res);
      }
       catch(ex){}
 }
  /**
  * Delete user 
  * @params req, res
  */
 module.exports.delete = function (req, res){
 	 try{ 
     	  parent.deleteParent(req, res);
     	}
       catch(ex){}
 }
 /**
 * Get the kids list by criteria
 */
 module.exports.kidsList = function (req, res){
    try{
         parent.KidsList(req, res);
       }
       catch(ex){}
 }
 /**
 * Remove student by the parent
 */
 module.exports.kidRemove = function (req, res){
  try{
    parent.kidRemove(req, res);
  }
  catch(ex){}
 }

/**
 * total school list
 */
 module.exports.totalSchools = function(req, res){
  try{
    parent.totalSchools(req, res);
  }
  catch(ex){}
 }

/**
 * Class list by school id. 
 */
 module.exports.classList = function(req, res){
   try{
    parent.classList(req, res);
  }
  catch(ex){}
 }
 
 
 /**
 * message list for student
 */
 module.exports.messageList= function(req, res){
	
   try{
    parent.message(req, res);
	
  }
  catch(ex){}
 }