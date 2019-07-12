var save_deviceid = require('../models/save_deviceid');

 /**
  * Save device id
  * @params req, res
  */
 module.exports.save_deviceid = function (req, res){
   try{ 
        save_deviceid.save_deviceid(req, res);
      }
       catch(ex){}
 }
  /**
  * Update device id
  * @params req, res
  */ 
module.exports.save_deviceid_update = function (req, res){
   try{ 
        save_deviceid.save_deviceid_update(req, res);
      }
       catch(ex){}
 }
 /**
  * Get Save device id
  * @params req, res
  */ 
 module.exports.save_deviceid_getdata = function (req, res){
   try{ 
        save_deviceid.save_deviceid_getdata(req, res);
      }
       catch(ex){}
 }