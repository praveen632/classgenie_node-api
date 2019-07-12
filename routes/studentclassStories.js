var studentclassStories = require('../models/studentclassStories');

/**
 Get student class stories.
 **/
module.exports.listClassStories =function(req,res){
	try{
		studentclassStories.listClassStories(req, res);
	}catch(ex){}
}

