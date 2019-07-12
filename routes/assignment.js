var assignment = require('../models/assignment');
/**
 * Post assingnment by teacher.   
 */
 module.exports.assignmentPost = function(req, res){
 	try{
 		assignment.assignmentPost(req, res);
 	}
 	catch(ex){};
 }
 
 /**
 * Get the assignment list by criteria
 */ 
 module.exports.assignmentList = function(req, res){
 	try{
 		assignment.assignmentList(req, res);
 	}
 	catch(ex){};
 }



 /**
 * Get the assignment list by criteria
 */ 
 module.exports.assignmentListById = function(req, res){
 	try{
 		assignment.assignmentListById(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Update assignment by teacher.
 */
 module.exports.assignmentUpdate = function(req, res){
 	try{
 		assignment.assignmentUpdate(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Delete assignment.
 */
 module.exports.assignmentDelete = function(req, res){
 	try{
 		assignment.assignmentDelete(req, res);
 	}
 	catch(ex){};
 }

 /**
 * List of submite assignment.
 */
 module.exports.submitedList = function(req, res){
 	try{
 		assignment.submitedList(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Serching assignment.
 */
 module.exports.assignmentClassList = function(req, res){
 	try{
 		assignment.assignmentClassList(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Parent assignment list.
 */
 module.exports.parentAssignmentList = function(req, res){
 	try{
 		assignment.parentAssignmentList(req, res);
 	}
 	catch(ex){};
 }
 
 /**
 * Parent assignment list.
 */
 module.exports.studentAssignmentList = function(req, res){
 	try{
 		assignment.studentAssignmentList(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Submit assignment.
 */
 module.exports.assignmentSubmit = function(req, res){
 	try{
 		assignment.assignmentSubmit(req, res);
 	}
 	catch(ex){};
 }

/**
 * Reminder send by teacher.
 */
 module.exports.assignmentReminder = function(req, res){
 	try{
 		assignment.assignmentReminder(req, res);
 	}
 	catch(ex){};
 }

/**
 * Student List.
 */
 module.exports.studentList = function(req, res){
 	try{
 		assignment.studentList(req, res);
 	}
 	catch(ex){};
 }
 
/**
 * Student List.
 */
 module.exports.sendNotification = function(req, res){
 	try{
 		assignment.sendNotification(req, res);
 	}
 	catch(ex){};
 }

/**
 * Udate data only.
 */
 module.exports.dataUpdateAssignment = function(req, res){
 	try{
 		assignment.dataUpdateAssignment(req, res);
 	}
 	catch(ex){};
 }