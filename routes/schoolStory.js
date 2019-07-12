var schoolStory = require('../models/schoolStory');
/**
 * Post the school story by criteria.
 */
 module.exports.postSchoolStory = function(req, res){
 	try{
 		schoolStory.postSchoolStory(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Update the school story.
 */
 module.exports.updatepostSchoolStory = function(req, res){
 	try{
 		schoolStory.updatepostSchoolStory(req, res);
 	}
 	catch(ex){}
 }

 /* All Posts Without Image/ vedio School stories */
  module.exports.postMsgSchoolStories = function (req, res){
    try{
         schoolStory.postMsgSchoolStories(req, res);
       }
       catch(ex){}
 }

  /**
 * Like in school story.
 */
 module.exports.likeSchoolStory = function(req, res){
 	try{
 		schoolStory.likeSchoolStory(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Like list in school story.
 */
 module.exports.likesListSchoolStory = function(req, res){
 	try{
 		schoolStory.likesListSchoolStory(req, res);
 	}
 	catch(ex){}
 }
 /**
 * Comment in school story.
 */
 module.exports.commentSchoolStory = function(req, res){
 	try{
 		schoolStory.commentSchoolStory(req, res);
 	}
 	catch(ex){}
 }
 /**
 * All Comment Details in school story.
 */
 module.exports.allCommentDetail = function(req, res){
 	try{
 		schoolStory.allCommentDetail(req, res);
 	}
 	catch(ex){}
 }
 /**
 * All Post Details in school story.
 */
 module.exports.allPostSchoolStory = function(req, res){
 	try{
 		schoolStory.allPostSchoolStory(req, res);
 	}
 	catch(ex){}
 }
  /**
 * All Comment Details in school story in single post.
 */
 module.exports.allcommentShoolStories = function(req, res){
 	try{
 		schoolStory.allcommentShoolStories(req, res);
 	}
 	catch(ex){}
 }
  /**
 * Delete school story .
 */
 module.exports.deleteSchoolStories = function(req, res){
 	try{
 		schoolStory.deleteSchoolStories(req, res);
 	}
 	catch(ex){}
 }
  /**
 * Update school story .
 */
 module.exports.updateMsgSchoolStories = function(req, res){
 	try{
 		schoolStory.updateMsgSchoolStories(req, res);
 	}
 	catch(ex){}
 }

