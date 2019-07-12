var classlist = require('../models/classlist');
/**
 * Get the class list 
 */
 module.exports.classlist = function (req, res){

      classlist.classlist(req, res);
 }
 /**
 * Give the positive pointweight  
 */
module.exports.positivepointweight = function (req, res){

      classlist.positivepointweight(req, res);
 }
 /**
 * Give the negative pointweight  
 */
 module.exports.negativepointweight = function (req, res){

      classlist.negativepointweight(req, res);
 }
 /**
 * Get the chat icon list 
 */
 module.exports.chaticon = function (req, res){

      classlist.chaticon(req, res);
 }
 