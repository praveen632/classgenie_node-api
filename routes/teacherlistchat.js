var teacherlistchat = require('../models/teacherlistchat');
/**
 * Get the Parent list by criteria
 */
 module.exports.teacherlistchat = function (req, res){
 	  try{
 	  	   teacherlistchat.teacherlistchat(req, res);
       }
       catch(ex){}
 }