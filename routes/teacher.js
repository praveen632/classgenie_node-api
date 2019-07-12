var teacher = require('../models/teacher');
/**
 * Get the teacher list by criteria
 */
 module.exports.list = function (req, res){
      teacher.listTeacher(req, res);
 }
 
 
 /**
 * Change the status of teacher in Portal
 */
 module.exports.portal_change_status = function (req, res){
	 
	 try{ 
       teacher.portal_change_status(req, res);
      }
       catch(ex){}
      
 }
 
 
 
  /**
 * Get the teacher data via ID in portal
 */
 module.exports.getPortalDataById = function (req, res){
	 
	 try{ 
       teacher.getPortalDataById(req, res);
      }
       catch(ex){}
      
 }
 
 
 /**
  * Update teacher data via ID in portal
  * @params req, res
  */
 module.exports.updateportalTeacherById = function (req, res){
 	 try{ 
     	  teacher.updateportalTeacherById(req, res);
     	}
       catch(ex){}
 }

 
 /**
  * Update teacher data via ID in portal
  * @params req, res
  */
 module.exports.remove_teacher_portal = function (req, res){
 	 try{ 
     	  teacher.remove_teacher_portal(req, res);
     	}
       catch(ex){}
 }
 



 /**
  *  Search teacher information by criteria
  */
 module.exports.search = function (req, res){
      teacher.searchTeacher(req, res);
 }

 /**
  * Add teacher 
  * @params req, res
  */
 module.exports.save = function (req, res){
 	 try{ 
     	  teacher.addTeacher(req, res);
     	}
       catch(ex){}
 }

 /**
  * Update Teacher 
  * @params req, res
  */
 module.exports.update = function (req, res){
   try{ 
        teacher.updateTeacher(req, res);
      }
       catch(ex){}
 }

/**
  * Delete Teacher 
  * @params req, res
  */
 module.exports.delete = function (req, res){
   try{ 
        teacher.deleteTeacher(req, res);
      }
       catch(ex){}
 }
 


