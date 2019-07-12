var api_token = require('../models/api_token');
/**
 * Get the student list 
 */
 module.exports.api_token = function (req, res){
      api_token.tokengen(req, res);
 }
