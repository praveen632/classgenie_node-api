var studentListMsg = require('../models/studentListMsg');
/**
 * Get the student msg list by criteria
 */
 module.exports.studentList = function (req, res){
 	  try{
 	  	   studentListMsg.listStudent(req, res);
       }
       catch(ex){}
 }