var add_student = require('../models/add_student');
/**
 * Get the student list 
 */
 module.exports.list_student = function (req, res){
      add_student.listStudent(req, res);
 }
 /**
 * update student 
 */
 module.exports.update_student = function (req, res){
      add_student.updateStudent(req, res);
 }
 /**
 * delete student 
 */
 module.exports.delete_student = function (req, res){
      add_student.deleteStudent(req, res);
 }
 /**
 * add student 
 */
module.exports.add_student = function (req, res){
      add_student.addStudent(req, res);
 }
 /**
 * student image list 
 */
 module.exports.studentImageList = function (req, res){
      add_student.imageList(req, res);
 }
 /**
 * add multiple student 
 */
 module.exports.multiple_student = function (req, res){
 	try{  	
  	      add_student.multiple_student(req, res);
      }
      catch(ex){}
 }