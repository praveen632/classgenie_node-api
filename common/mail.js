var fs = require('fs');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('./config');
var config_constant = require('./config_constant');
var _global = require('./global');

/**
 * Common email class
 */

var transporter = nodemailer.createTransport(smtpTransport({
    host: (config.env == 'production' ? config_constant.PROD_MAIL_HOST : config_constant.MAIL_HOST),
    port: config_constant.MAIL_PORT,
    secure: true,
    auth: {
        user: (config.env == 'production' ? config_constant.PROD_MAIL_USER : config_constant.MAIL_USER),
        pass: (config.env == 'production' ? config_constant.PROD_MAIL_PASS : config_constant.MAIL_PASS),
    }
}));

module.exports = {
 	 send: function (mailobj, obj){
 	 	
 	 	
 	 	if(typeof obj.attachment_name == 'undefined'){
	           transporter.sendMail({
	        	 from: (config.env == 'production' ? config_constant.PROD_MAIL_FROM : config_constant.MAIL_FROM),
			     to: mailobj.to, 
			     bcc: (config.env == 'production' ? config_constant.CUSTOMER_CARE1 : mailobj.to),
			     subject: mailobj.subject+(config.env == 'production'?'':'<Classgenie Testing>'), 
			     html: formatBody(mailobj, obj)
	          }, function(error, info){
				    if(error){
				        return _global.fclog(error);
				    }
				    _global.fclog('Message sent: ' + info.response);
				});
 	 	}
 	 	else
 	 	{
	        transporter.sendMail({
	        	 from: (config.env == 'production' ? config_constant.PROD_MAIL_FROM : config_constant.MAIL_FROM),
			     to: mailobj.to, 
			     bcc: config_constant.CUSTOMER_CARE1,
			     subject: mailobj.subject+(config.env == 'production'?'':'<Testing>'), 
			     html: formatBody(mailobj, obj),
			     attachments:[
			        { 
			            filename: obj.attachment_name,
			            path: obj.attachment
			        }
			     ]
	          }, function(error, info){
				    if(error){
				        return console.log(error);
				    }
				    _global.fclog('Message sent: ' + info.response);
				});
         }
 	  }
 }

 formatBody = function(mailobj, obj){

      var html_template = fs.readFileSync('./views/email_template/default_template.ejs','utf8');  
        html_template = ejs.render(html_template, {title:'', body: mailobj.body,subject:mailobj.subject});
	    return html_template;
 }