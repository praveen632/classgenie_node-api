var resetBubbles = require('../models/resetBubbles');
/**
 * Get the bubbles list by criteria
 */
 module.exports.list = function (req, res){
 	  try{
 	  	   resetBubbles.listBubbles(req, res);
       }
       catch(ex){}
 }
 /**
 * Reset per student bubble
 */
 module.exports.reset = function (req, res){
 	  try{
 	  	   resetBubbles.studentBubble(req, res);
       }
       catch(ex){}
 }
 /**
 * Reset group bubble
 */
 module.exports.resetGroup = function (req, res){
 	  try{
 	  	   resetBubbles.groupBubble(req, res);
       }
       catch(ex){}
 }
 