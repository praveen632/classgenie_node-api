/**
 * Common connection class
 */
 var mysql = require('mysql');
 var config = require('./config');
 var connection1 = mysql.createConnection({ 
		     host : config.host,
		     user : config.user,
		     password : config.password,
		     database : config.database1,
		    
		 });


 module.exports = connection1;

