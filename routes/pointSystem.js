var pointSystem = require('../models/pointSystem');
/**
 * Get the student Point list by criteria
 */
 module.exports.studentList = function (req, res){
 	  try{
 	  	   pointSystem.studentPointList(req, res);
       }
       catch(ex){}
 }
 /**
  * Update Student Point
  * @params req, res
  */
 module.exports.studentUpdate = function (req, res){
   try{ 
        pointSystem.updateStudentPoint(req, res);
      }
       catch(ex){}
 }
 /**
 * Get the student Point list by criteria
 */
 module.exports.classList = function (req, res){
 	  try{
 	  	   pointSystem.classPointList(req, res);
       }
       catch(ex){}
 }
  /**
  * Update Student Point
  * @params req, res
  */
 module.exports.classUpdate = function (req, res){
   try{ 
        pointSystem.updateClassPoint(req, res);
      }
       catch(ex){}
 }