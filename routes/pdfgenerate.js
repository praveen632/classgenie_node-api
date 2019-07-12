var pdf = require('../models/pdfgenerate');
/**
 * Generate pdf
 */
 module.exports.pdf = function (req, res){
 	  try{
 	  	   pdf.pdfgenerate(req, res);
       }
       catch(ex){}
 }