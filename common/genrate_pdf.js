var _ = require('underscore');
var fs = require('fs');
var ejs = require('ejs');
var pdf = require('html-pdf');
var _global = require('./global');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
/**
 * Common pdf class
 */
 module.exports = {
 	genratePdf: function (obj, req, res){
 		var output={};
 		var teachername = obj[1][0].name;
 		var pdfname = 'ClassGenie_parent_invites_for_class_'+obj[2][0].id;
 		if(_.size(obj)<1){
	         obj = {};
	      }
         size = _.size(obj[0]);         
         var pdf_template = '';         
        for(var i=0;i<size;i++){
         var template = fs.readFileSync('./views/pdf_template/default_template.ejs','utf8');
	     pdf_template += ejs.render(template,{student_no: obj[0][i]['student_no'], parent_no:obj[0][i]['parent_no'],teachername:teachername,student_name:obj[0][i]['name'], size:size});
		 }
         var options = { format: 'A4' };
	     pdf.create(pdf_template, options).toFile(config.upload_path+'/pdf/code/'+pdfname+'.pdf', function(err, res1) {
		  		if (err) return _global.fclog(err);
		 		//_global.fclog(res1);  
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                res.json(output);
		});
 	}
 }