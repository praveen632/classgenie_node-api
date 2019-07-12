var report = require('../models/report');
/**
 * Get the student report by criteria
 */
 module.exports.studentReportList = function(req, res){
 	try{
 	    report.studentReportList(req, res);
     }
      catch(ex){} 
 }
 /**
 * Get the class report by criteria
 */
 module.exports.classReportList = function(req, res){
    try{
    	report.classReportList(req, res);
    }
    catch(ex){}
 }
 /**
 * Add remark by post method.
 */
 module.exports.addRemark = function(req, res){
 	try{
 		report.addRemark(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Remove report by post method.
 */
 module.exports.removeReport = function(req, res){
 	try{
 		report.removeReport(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Remove remark by post method.
 */
 module.exports.removeRemark = function(req, res){
 	try{
 		report.removeRemark(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Student class report list.
 */
 module.exports.studentClassReportList = function(req, res){
    try{
 		report.studentClassReportList(req, res);
 	}
 	catch(ex){}
 }

 module.exports.allReportList = function(req, res){
 	
 	try{
 		report.allReportList(req, res);
 	}
 	catch(ex){}
 }

