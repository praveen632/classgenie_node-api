var download_exl = require('../models/download_exl');
/**
 * Post download to excel file
 */
 module.exports.download_excel = function (req, res){
 	  try{
 	  	    download_exl.download_excel(req, res);
       }
       catch(ex){}
 }
