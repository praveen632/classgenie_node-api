var groupinfo = require('../models/groupinfo');
/**
 * Get the group list 
 */
 module.exports.grouplist = function (req, res){
      groupinfo.grouplist(req, res);
 }
 /**
 * Save the Group info 
 */
 module.exports.addgroup = function (req, res){
      groupinfo.addgroup(req, res);
 }
/**
 * Update the Group info 
 */
 module.exports.updategroup = function(req,res){
 	groupinfo.updategroup(req,res);
 }
 /**
 * Delete the Group 
 */
 module.exports.deletegroup = function(req,res){
 	groupinfo.deletegroup(req,res);
 }
 /**
 * Save the  pointweight in Group 
 */
 module.exports.pointweight = function(req,res){
 	groupinfo.pointweight(req,res);
 }
 /**
 * Get information the Group info 
 */ 
 module.exports.group_info = function(req,res){
 	groupinfo.group_info(req,res);
 }
 /**
 * Get student list  
 */
module.exports.studentlist = function(req,res){
 	groupinfo.studentlist(req,res);
 }
 /**
 * Get student list in group 
 */
 module.exports.group_studentlist = function(req,res){
 	groupinfo.group_studentlist(req,res);
 }