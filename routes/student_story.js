var student_story = require('../models/student_story');
/**
 * save student massege stories
 */
 module.exports.studentStoryMsgpost = function(req, res){
 	try{
 		student_story.studentStoryMsgpost(req, res);
 	}
 	catch(ex){};
 }

 /**
 * Update student massege stories
 */
 module.exports.updateStudentStoryMsg = function(req, res){
 	try{
 		student_story.updateStudentStoryMsg(req, res);
 	}
 	catch(ex){};
 }

 /**
 * save student photo\video stories
 */
 module.exports.studentStoryPost = function(req, res){
 	try{
 		student_story.studentStoryPost(req, res);
 	}
 	catch(ex){};
 }

/**
 * update student photo\video stories
 */
 module.exports.updatePostStudentStory = function(req, res){
 	try{
 		student_story.updatePostStudentStory(req, res);
 	}
 	catch(ex){};
 }

 /**
 * update student photo\video stories
 */
 module.exports.studentStoryList = function(req, res){
  	try{
 		student_story.studentStoryList(req, res);
 	}
 	catch(ex){};
 }

 /**
 * update student photo\video stories
 */
 module.exports.storyApproveTeacher = function(req, res){
 	try{
 		student_story.storyApproveTeacher(req, res);
 	}
 	catch(ex){};
 }

 /**
 * update student photo\video stories
 */
 module.exports.deleteStudentPost = function(req, res){
 	try{
 		student_story.deleteStudentPost(req, res);
 	}
 	catch(ex){};
 }

 /**
 * comment details
 */
 module.exports.commentDetail = function(req, res){
 	try{
 		student_story.commentDetail(req, res);
 	}
 	catch(ex){};
 }

 /**
 * comment details
 */
 module.exports.classPostList = function(req, res){
 	try{
 		student_story.classPostList(req, res);
 	}
 	catch(ex){};
 }
 /**
 * Schoolo list
 */
 module.exports.schoolList = function(req, res){
 	try{
 		student_story.schoolList(req, res);
 	}
 	catch(ex){};
 }