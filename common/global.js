var config = require('./config');
var moment = require('moment-timezone');
/**
 * Common global class
 * It inclueds all common function
 */
module.exports = {
	//Global console log function
	fclog: function (str){
	   console.log(str);
	},
  //Return formate date in yyyy-mm-dd
  formatDate: function(strdate){
   	  var strdate = (typeof strdate == 'undefined' ? new Date() : strdate);
   	  var d = new Date(strdate),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
	    if (month.length < 2) month = '0' + month;
	    if (day.length < 2) day = '0' + day;

	    return [year, month, day].join('-');
   },
   //Retrun formate date yyyy-mm-dd hh:mm:ss
   js_yyyy_mm_dd_hh_mm_ss:function(strdate){
   	      var strdate = (typeof strdate == 'undefined' ? new Date() : strdate);
          now = new Date(strdate);
		  year = "" + now.getFullYear();
		  month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
		  day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
		  hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
		  minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
		  second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
		  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
   }, 

   js_yyyy_mm_dd:function(strdate){
          var strdate = (typeof strdate == 'undefined' ? new Date() : strdate);
          now = new Date(strdate);
      year = "" + now.getFullYear();
      month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
      day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
      
      return year + "-" + month + "-" + day;
   }, 
   //Return current timestamp
   getTimeStamp: function (){return moment().tz("Asia/Calcutta").unix();},
   //Write into log
   writeIntoLog: function(strData){
   	   var fs = require('fs');
       var wstream = fs.createWriteStream('logs/myOutput.txt');
 	   wstream.write(strData);
 	   wstream.end();
   },
   //Genrate randon string with 8 digit
   getCode:function(type, length){
       var randomstring = require("randomstring");
       if(typeof length == 'undefined')
           length = 8;
       var code = randomstring.generate({
          length: length,
          capitalization: 'uppercase'
        });
       return type+code;
   },


   pushNotification: function(obj){
         var FCM = require('fcm-push');
         var serverKey = config.sender_id;
         var fcm = new FCM(serverKey);
         var message = {
            to: obj.device_id, 
            collapse_key: 'your_collapse_key', 
            data: {
                 module_id : obj.module_id,
                 name : obj.name,
                 class_id: obj.class_id,
                 member_no:obj.member_no,
                 icon: "ic_launcher"
            },
            notification: {
                title: obj.title,
                body: obj.message
            }
         };

        fcm.send(message, function(err, response){
            if (err) {console.log(err);
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
   },

   testNotification:function(){ 
      var FCM = require('fcm-push');
      var serverKey = "AAAAatftVmU:APA91bG2JqJUxyb5-wT_2bcP3fn2utoE2DF51Zz11Hjg8-YTYIpZx9BirgpFQ0yL4VUm-JTz3iea5oFhWjVy3EYKHSubjzbSiJtvWtsMa4fSZrLw8EezEZy9k293LpIweWZl2x2_gJoR";
      var fcm = new FCM(serverKey);
      var message = {
          to: "crfa9mAKHYI:APA91bHaCWSb_X0VcpIhEHrfL1oS3zOiJOPlkt09a0dAhnPi8FjdQT3bm7X6QF8w_k1VT_lZZhP0lTARyEtWaWOdj9r5oyT1ItGjSQJTHAANipu26dwFFZLkxqI0XIKedi-GVdyuZrZ0", 
          collapse_key: 'your_collapse_key', 
          data: {
                module_id : 1,
                message: 'Hello this is message body',
                name : 'dshahi',
                class_id: 'abccc',
                member_no: 20000345,
                title: 'This is title',
                icon: "ic_launcher"
          },
          notification: {
              title: 'Title of your push notification',
              body: 'Body of your push notification'
          }
      };

      fcm.send(message, function(err, response){
          if (err) {console.log(err);
              console.log("Something has gone wrong!");
          } else {
              console.log("Successfully sent with response: ", response);
          }
      });
  },
  
  /// find substring  
   cutString : function (s, n){
		if(s.length>20){   
			var cut= s.indexOf(' ', n);
			if(cut== -1) return s;
			return s.substring(0, cut)
		}
		else
		{
			return s;
		}
   }

}
