var classinfo = require('../models/classinfo');
/**
 * Get the image list by criteria
 */
 module.exports.list = function (req, res){
      classinfo.imageList(req, res);
 }

 /**
  *  Get the users list for sarching
  */
 module.exports.search = function (req, res){
      classinfo.searchClassinfo(req, res);
 }

 /**
  *  Get the users list for dashboard
  */
 module.exports.dashboard = function (req, res){
      classinfo.dashboardUsers(req, res);
 }

/**
  *  Get the student list for dashboard
  */
 module.exports.studentlist = function (req, res){
      classinfo.studentlistUsers(req, res);
 }
 
 
 
 /**
  *  Get the student list for Portal
  */
 module.exports.studentListPortal = function (req, res){
      classinfo.studentListPortal(req, res);
 }
 
 
 /**
  *  Add the student list via CSV for Portal
  */
 module.exports.saveCsvFile = function (req, res){
	 classinfo.saveCsvFile(req, res);
 }
 
 


 /**
  * Add classinfo 
  * @params req, res
  */
 module.exports.save = function (req, res){
   try{ 
        classinfo.addClassinfo(req, res);
      }
       catch(ex){}
 }
/**
  * Update classinfo 
  * @params req, res
  */
 module.exports.update = function (req, res){
   try{ 
        classinfo.updateClassinfo(req, res);
      }
       catch(ex){}
 }
 /**
  *  Delete class
  */
 module.exports.delete = function (req, res){
      classinfo.deleteClassinfo(req, res);
 }