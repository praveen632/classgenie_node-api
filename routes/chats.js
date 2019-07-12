var chats = require('../models/chats');

/**
  * Return list of docs
  * @params req, res
  */
 module.exports.list = function (req, res){
   try{ 
        chats.list(req, res);
      }
       catch(ex){}
 }

  /**
  * Save chat data 
  * @params req, res
  */
 module.exports.save = function (req, res){
 	 try{ 
     	  chats.save(req, res);
     	}
       catch(ex){}
 }
  /**
  * Update chat data 
  * @params req, res
  */
 module.exports.update_chat = function (req, res){
 	 try{ 
     	  chats.update(req, res);
     	}
       catch(ex){}
 }

 /**
  * Remove chat data 
  * @params req, res
  */
 module.exports.remove_chat = function (req, res){
 	 try{ 
     	  chats.remove(req, res);
     	}
       catch(ex){}
 }

 /**
  * Update chat notification
  * @params req, res
  */
 module.exports.chat_notification = function (req, res){
   try{ 
        chats.chat_notification(req, res);
      }
       catch(ex){}
 }