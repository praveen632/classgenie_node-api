var awardmultiple = require('../models/awardmultiple');
/**
 * Give Award in class
 */
 module.exports.awardClass = function (req, res){
      awardmultiple.awardClass(req, res);
 }
/**
 * Give Award in group
 */
  module.exports.awardGroup = function (req, res){
      awardmultiple.awardGroup(req, res);
 }