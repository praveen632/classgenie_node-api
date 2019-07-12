var student = require('../models/student');
/**
 * Get the student list by criteria
 */
 module.exports.list = function (req, res){
      student.listStudent(req, res);
 } 

 /**
  *  Search student list
  */
 module.exports.search = function (req, res){
      student.searchStudent(req, res);
 }
 /**
  *  Save the student information
  */
 module.exports.save = function (req, res){
      student.insertStudent(req, res);
 }
 /**
  *  Update student
  */
 module.exports.update = function (req, res){
      student.updateStudent(req, res);
 }
 /**
  *  Delete student 
  */
 module.exports.delete = function (req, res){
      student.deleteStudent(req, res);
 }
 /**
  *  Select student list by criteria
  */
 module.exports.saveAdd = function (req, res){
      student.insertStudentAdd(req, res);
 }
  /**
  *  Add the student by the student code\check student code available or not.
  */
module.exports.addStudentCode = function (req, res){
  student.addStudentCode(req, res);
}
  /**
  *  Get student list by criteria.
  */
module.exports.studentList = function(req, res){
  student.studentLists(req, res);
}  
 /**
  *  Delete student .
  */
module.exports.studentDisconnect = function(req, res){
  student.studentDisconnect(req, res);
}
/**
  *  Update image.
  */
module.exports.updateImage = function(req, res){
	 student.updateImage(req, res);
}

module.exports.StudentClassList = function(req, res){
  student.StudentClassList(req, res);
}

