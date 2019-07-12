var events = require('../models/events');
   
 /**
  * create event 
  * @params req, res
  */
 module.exports.create_event = function (req, res){
   try{ 
        events.create_event(req, res);
      }
     catch(ex){}
 } 
 
 /**
  * edit event 
  * @params req, res
  */
 module.exports.edit_event = function (req, res){
   try{ 
        events.edit_event(req, res);
      }
       catch(ex){}
 } 
 
  /**
  * List event 
  * @params req, res
  */
 module.exports.eventList = function (req, res){
   try{ 
        events.eventList(req, res);
      }
       catch(ex){}
 } 
 
  /**
  * event student list 
  * @params req, res
  */
 module.exports.eventStudentList = function (req, res){
   try{ 
        events.eventStudentList(req, res);
      }
       catch(ex){}
 } 
 
 /**
  * event student list    
  * @params req, res
  */
 module.exports.eventParentList = function (req, res){
   try{ 
        events.eventParentList(req, res);
      }
       catch(ex){}
 } 
 
 /**
  * be volunteer by parent    
  * @params req, res
  */
 module.exports.addVolunteer = function (req, res){
   try{ 
        events.addVolunteer(req, res);
      }
       catch(ex){}
 } 
 
  /**
  * List event 
  * @params req, res
  */
 module.exports.deleteEvent = function (req, res){
   try{ 
        events.deleteEvent(req, res);
      }
       catch(ex){}
 }

 /**
  * List event 
  * @params req, res
  */
 module.exports.eventVolunteerList = function (req, res){
   try{ 
        events.eventVolunteerList(req, res);
      }
       catch(ex){}
 }

 /**
  * Responsibilty list base on event id.
  * @params req, res
  */
 module.exports.responsibilty_list = function(req, res){
 try{
    events.responsibilty_list(req, res);
  }
  catch(ex){}
 }

 /**
  *Date time list base on event id.
  * @params req, res
  */
 module.exports.date_time_list = function(req, res){
  try{
    events.date_time_list(req, res);
  }
  catch(ex){}
 }

 /**
  *Remove event valunteer.
  * @params req, res
  */
 module.exports.quit_from_volunteer = function(req, res){
  try{
    events.quit_from_volunteer(req, res);
  }
  catch(ex){}
 }

/**
  *Parent name by event id.
  * @params req, res
  */
 module.exports.parent_name = function(req, res){
  try{
    events.parent_name(req, res);
  }
  catch(ex){}
 }