var checkstatus = require('../models/checkStatus');
/**
 * Post the users list login status by criteria
 */
 module.exports.list = function (req, res){
      checkstatus.updatestatus(req, res);
 }

 

