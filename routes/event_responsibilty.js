var event_responsibilty = require('../models/event_responsibilty');

/**
  * Return list of docs
  * @params req, res
  */
 module.exports.list = function (req, res){
  event_responsibilty.list(req, res);
   }


/**
  * Save responsibilty data 
  * @params req, res
  */
module.exports.save = function (req, res){
   event_responsibilty.save(req, res);
 }

 /**
  * Remove responsibilty data 
  * @params req, res
  */
 module.exports.remove_responsibilty = function (req, res){
 	 try{ 
     	  event_responsibilty.remove(req, res);
     	}
       catch(ex){}
 }


 /**
  * Update chat data 
  * @params req, res
  */
 module.exports.update_responsibilty = function (req, res){
 	 try{ 
     	  event_responsibilty.update(req, res);
     	}
       catch(ex){}
 }