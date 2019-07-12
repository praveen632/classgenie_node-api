var attendance = require('../models/attendance');
/**
 * Get the student list by criteria
 */
 module.exports.studentList = function(req, res){
 	try{
 		attendance.studentList(req, res);
 	}
 	catch(ex){}
 }
 
/**
 * Save the Attendance of all Student 
 */
 module.exports.saveAttendance = function(req, res){
 	try{
 		attendance.saveAttendance(req, res);
 	}
 	catch(ex){}
 }


 /**
 * Reset the Attendance of all Student by date
 */
 module.exports.attendance_reset = function(req, res){
 	try{
 		attendance.attendance_reset(req, res);
 	}
 	catch(ex){}
 }