var customizeSkills = require('../models/customizeSkills');
/**
 * Get the Customize Skills by criteria
 */
 module.exports.list = function (req, res){
 	  try{
 	  	   customizeSkills.editSkillsList(req, res);
       }
       catch(ex){}
 }
 /**
 * Get the image list by criteria
 */
 module.exports.imageList = function (req, res){
 	  try{
 	  	   customizeSkills.imageList(req, res);
       }
       catch(ex){}
 }

 /**
  * Add Customize Skills 
  * @params req, res
  */
 module.exports.save = function (req, res){
   try{ 
        customizeSkills.addEditSkills(req, res);
      }
       catch(ex){}
 }

 /**
  * Update Customize Skills 
  * @params req, res
  */
 module.exports.update = function (req, res){
   try{ 
        customizeSkills.updateEditSkills(req, res);
      }
       catch(ex){}
 }
 
  /**
  * Delete Customize Skills
  * @params req, res
  */
 module.exports.delete = function (req, res){
 	 try{ 
     	  customizeSkills.deleteEditSkills(req, res);
     	}
       catch(ex){}
 }


 