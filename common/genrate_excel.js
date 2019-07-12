var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var sendmail = require('../common/sendmail');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var encryption = require('../common/encryption');
var fs = require('fs');
var _global = require('../common/global');
var moment = require('moment-timezone');
 module.exports = {
	 	excelgenerate: function (obj,email,member_no,teacher_name,date1,date2,class_name,grade,req,res,student_detail){
		
	 	var res_output={};
	 	var file_name_timestamp =  _global.getTimeStamp();
		var file_name = 'Attendance for '+class_name+' grade '+grade + ' from '+date1+' to '+date2+'';
		var date_range = [];
		var header_date = '';
		var now = moment(date2); //todays date
		var end = moment(date1); // another date
		var date1 = new Date(date1);
		var date2 = new Date(date2);
		var diffDays = parseInt((date2 - date1) / (1000 * 60 * 60 * 24));
		for(var i=0;i<=diffDays;i++){				
		var d = (moment(date1).add(i, 'day').format('YYYY/MM/DD'));				
		date_range[i]=d;	
		header_date +=date_range[i]+","; 
		}	
		if(header_date != ''){
			header_date = header_date.substring(0, header_date.length-1);
		}		
	   	if (fs.existsSync(config.upload_path+'/attendance/'+file_name+'.csv')) {
	        fs.unlink(config.upload_path+'/attendance/'+file_name+'.csv');
	    } 
		var writeStream = fs.createWriteStream(config.upload_path+'/attendance/'+file_name+'.csv');
		var header="Student Name"+","+header_date+","+"Present(Total)"+","+"Late(Total)"+","+"Absent(Total)"+","+"Holiday"+","+"Teacher Absent"+"\n";
	    var data='';
	     _.each(student_detail, function(item, key){
	     	data += item.name;
	     	for(var i=0; i<date_range.length; i++){
	     		 if(typeof obj[key] == 'undefined'){
	     		 	data += ','+'-';
	     		 }
	     		 else
	     		 {
	     		 	if(typeof obj[key][date_range[i]] == 'undefined'){
	     		 		data += ','+'-';
	     		 	}
	     		 	else
	     		 	{
	     		 		data += ','+obj[key][date_range[i]];
	     		 	}
	     		 }
	     	}
	     		item.P = (typeof item.P == 'undefined' ? '0': item.P);
		 		item.L = (typeof item.L == 'undefined' ? '0': item.L);
		 		item.A = (typeof item.A == 'undefined' ? '0': item.A);
				item.H = (typeof item.H == 'undefined' ? '0': item.H);
		 		item.NA = (typeof item.NA == 'undefined' ? '0': item.NA);  	
	     	data +=","+item.P+","+item.L+","+item.A+","+item.H+","+item.NA+"\n";
	     });
	    output = header+data;
		writeStream.write(output);
		writeStream.close();
		 sendmail.send({id:16, 'to':email,'name':teacher_name, attachment_name:file_name+'.csv', attachment:"assets/attendance/"+file_name+".csv"});
		  res_output.status = message.success;
		  res_output.comments = message.success;
		  res_output.file_name = file_name;
		  res.json(res_output);
	}
}