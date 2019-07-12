var classStories = require('../models/classStories');
/**
 * save class stories
 */
 module.exports.saveClassStories = function (req, res){
 	  try{
 	  	   classStories.postClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * Getting all the list of classstories based on parent account number
 */
 module.exports.classStoriesList = function (req, res){
    try{
         classStories.classStoriesList(req, res);
         
       }
       catch(ex){}
 }

/**
 * Getting all the list of classstories based on student number
 */
 module.exports.student_classStoriesList = function (req, res){
    try{
         classStories.student_classStories_List(req, res);
         
       }
       catch(ex){}
 }

/**
 * Getting all the list of classes based on student number
 */
 module.exports.studentClasslist = function (req, res){
    try{
         classStories.studentClasslist(req, res);
         
       }
       catch(ex){}
 }

/**
 * classStories based on student_ac_no and class_id.
 */
 module.exports.studentClassStories = function (req, res){
    try{
         classStories.studentClassStories(req, res);
         
       }
       catch(ex){}
 }



 /**
 * Getting all the list of kids under the parent
 */
 module.exports.mykidslist = function (req, res){
    try{
         classStories.mykidslist(req, res);
         
       }
       catch(ex){}
 }


 /**
 * Update class stories
 */
 module.exports.updateClassStories = function (req, res){
 	  try{
 	  	   classStories.updateClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * Delete class stories
 */
 module.exports.deleteClassStories = function (req, res){
 	  try{
 	  	   classStories.deleteClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * List class stories
 */
 module.exports.listClassStories = function (req, res){
 	  try{
 	  	   classStories.listClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * Likes class stories
 */
 module.exports.likesClassStories = function (req, res){
  	  try{
 	  	   classStories.likesClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * Comment class stories
 */
 module.exports.commentClassStories = function (req, res){
  	  try{
 	  	   classStories.commentClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * All Posts class stories
 */
 module.exports.allpostClassStories = function (req, res){
       try{
         classStories.allpostClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * All Comments class stories
 */
 module.exports.allcommentClassStories = function (req, res){
      try{
         classStories.allcommentClassStories(req, res);
       }
       catch(ex){}
 }
 /**
 * All likes list in class stories
 */
 module.exports.likesList = function (req, res){
  try{
    classStories.likesList(req, res);
  }
  catch(ex){}
 }
/**
 * Parent stories
 */
 module.exports.parentstories = function(req, res){
  try{
      classStories.parentstories(req, res);
    }
  catch(ex){}   
}

/**
 * Delete comment in class story.
 */
module.exports.deleteComment = function(req, res){
  try{
    classStories.deleteComment(req, res);
  }
  catch(ex){}
}


