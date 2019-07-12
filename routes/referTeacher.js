var referTeacher = require('../models/referTeacher');
/**
 * Refer Teacher
 */
  module.exports.referTeacher = function (req, res){
 	  try{
 	  	   referTeacher.referTeacher(req, res);
       }
       catch(ex){}
 }