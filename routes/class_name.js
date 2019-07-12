var class_name = require('../models/class_name');
/**
 * Get the users list by criteria
 */
 module.exports.className = function (req, res){
 	  try{
 	  	   class_name.className(req, res);
       }
       catch(ex){}
 }