var schools = require('../models/schools');
/**
 * Get the school list by criteria
 */
 module.exports.schoolsList = function (req, res){
 	
 	  try{
 	  	   schools.schoolList(req, res);
       }
       catch(ex){}
 }
  /**
  * Add school 
  * @params req, res
  */
 module.exports.joinSchools = function (req, res){
 	 try{ 
     	  schools.joinSchools(req, res);
     	}
       catch(ex){}
 }
 /**
  * Change school 
  * @params req, res
  */
  module.exports.changeSchools = function (req, res){
  	try{
  		schools.changeSchools(req, res);
  	}
  	catch(ex){}
  }
  
  
  /**
  * School Countries
  * @params req, res
  */
  module.exports.CountriesSearch = function (req, res){
  	try{
  		schools.CountriesSearch(req, res);
  	}
  	catch(ex){}
  }
  
  
  /**
  * Portal Teacher List
  * @params req, res
  */
  module.exports.portal_teacherList = function (req, res){
  	try{
  		schools.portal_teacherList(req, res);
  	}
  	catch(ex){}
  }
  
  
 
  
  
   /**
  * School users
  * @params req, res
  */
  
  module.exports.checkUser = function (req, res){
  	try{
  		schools.checkUser(req, res);
  	}
  	catch(ex){}
  }
  
  
   /**
  * Search school 
  * @params req, res
  */
  module.exports.schoolsSearch = function (req, res){
    try{
      schools.searchSchools(req, res);
    }
    catch(ex){}
  }
  /**
  * Get teacher list  
  * @params req, res
  */
  module.exports.teacherlist = function(req, res){
    try{
      schools.teacherlist(req, res);
    }
    catch(ex){}
  }
  /**
  * Add school by user  
  * @params req, res
  */
  module.exports.addSchoolsList = function(req, res){
    try{
          schools.addSchoolsList(req, res);
       }
    catch(ex){}
  }

  /**
  * Add school by user portal  
  * @params req, res
  */
  module.exports.addschoolslistportal = function(req, res){
    try{
          schools.addschoolslistportal(req, res);
       }
    catch(ex){}
  }
  /**
  * Return Teacher list  
  * @params req, res
  */
  module.exports.teacherList = function(req, res){
    try{
      schools.teacherList(req, res);
    }
    catch(ex){}
  }

  /**
  * Teacher list with limit.  
  * @params req, res
  */
  module.exports.teacherListLimit = function(req, res){
    try{
      schools.teacherListLimit(req, res);
    }
    catch(ex){}
  }
/**
  * School_Update.  
  * @params req, res
  */
 module.exports.school_update = function (req, res){
   try{ 
        schools.school_update(req, res);
      }
       catch(ex){}
 }

 /**
  * Teacher approve.  
  * @params req, res
  */
 module.exports.teacherApprove = function(req, res){
  try{
    schools.teacherApprove(req, res);
  }
  catch(ex){}
 }
 
  module.exports.schoolDetails = function(req, res){
  try{
    schools.schoolDetails(req, res);
  }
  catch(ex){}
  }



  