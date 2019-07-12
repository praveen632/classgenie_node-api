var connectparent = require('../models/connectparent');
/**
 * Get the student list 
 */
 module.exports.studentlist = function (req, res){
       connectparent.studentlist(req, res);
 }
 /**
 * Send invetaion mail to parent 
 */
module.exports.parentinvite = function(req,res){
	connectparent.parentinvite(req,res);
}


