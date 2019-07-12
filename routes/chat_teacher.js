var chat_teacher = require('../models/chat_teacher');

 /**
  * Return list of docs
  * @params req, res
  */
 module.exports.list = function (req, res){
   try{ 
        chat_teacher.list(req, res);
      }
       catch(ex){}
 }
  
 /**
  * Save chat data 
  * @params req, res
  */
 module.exports.save = function (req, res){
 	 try{ 
     	  chat_teacher.save(req, res);
     	}
       catch(ex){}
 }

 /**
  * Update chat notification
  * @params req, res
  */
 module.exports.chat_notification = function (req, res){
   try{ 
        chat_teacher.chat_notification(req, res);
      }
       catch(ex){}
 }
 
 /**
  * Update chat data 
  * @params req, res
  */
 module.exports.update_chat = function (req, res){
 	 try{ 
     	  chat_teacher.update(req, res);
     	}
       catch(ex){}
 }
 
 /**
  * Remove chat data 
  * @params req, res
  */
 module.exports.remove_chat = function (req, res){
 	 try{ 
     	  chat_teacher.remove(req, res);
     	}
       catch(ex){}
 }