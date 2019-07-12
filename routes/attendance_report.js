var attendance_report = require('../models/attendance_report');
/**
 * Get the student Attendance 
 */
 module.exports.attendance_report = function(req, res){
 	try{
 		attendance_report.attendance_report(req, res);
 	}
 	catch(ex){}
 }