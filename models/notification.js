var _ = require('underscore');
var gcm = require('node-gcm');
var config = require('../common/config');
var _global = require('../common/global');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');

module.exports = {
      /**
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      pushnotification: function (req, res){
       /* var message = new gcm.Message({
          data: {
            title: 'Classgenie123',
            module_id : 1,
            message: 'Hello This is message'
          }            
        });  
		 
		var sender = new gcm.Sender('AAAAatftVmU:APA91bG2JqJUxyb5-wT_2bcP3fn2utoE2DF51Zz11Hjg8-YTYIpZx9BirgpFQ0yL4VUm-JTz3iea5oFhWjVy3EYKHSubjzbSiJtvWtsMa4fSZrLw8EezEZy9k293LpIweWZl2x2_gJoR');
	    var regTokens = ['cnIl65lrjU0:APA91bFyAn6MbpMm3ElSERkzgQ0IYUZ_4MNYlNPOrM1Dk33ecLj38qY6ouMsXxPMJysR2zxJD_AveIgSiq9NeNTDkXvrqaFPhqSJaVPOm_Fmj6q4tkcECeihyxfMboQd9QzkBb4wKFTO'];
      sender.send(message, { registrationTokens: regTokens }, function (err, response) {
        if(err) console.error(err);
        else 	console.log(response);
      });*/


      var FCM = require('fcm-push');
var serverkey = 'AAAAatftVmU:APA91bG2JqJUxyb5-wT_2bcP3fn2utoE2DF51Zz11Hjg8-YTYIpZx9BirgpFQ0yL4VUm-JTz3iea5oFhWjVy3EYKHSubjzbSiJtvWtsMa4fSZrLw8EezEZy9k293LpIweWZl2x2_gJoR';  
var fcm = new FCM(serverkey);
var message = {  
    to : 'dJTKsdrFHOE:APA91bFuK7pZLt6Fgmnsa_IynzoUdfIldNhdabDgGDIqRQtQp5lx85CtR345NJ3qPL-VMA5LzMQXBZhCHm5yCJhNnFDau-ym_0ZiAF9Ov7KSwrYl9HKTtGt6EgXX5oIgSeDkHMrbcGLl',
    collapse_key : '<insert-collapse-key>',
    data : {
        'a' : '123'
    },
    notification : {
        title : 'Title of the notification',
        body : 'Body of the notification'
    }
};
fcm.send(message, function(err,response){  
    if(err) {
        console.log("Something has gone wrong !");
    } else {
        console.log("Successfully sent with resposne :",response);
    }
});

    },
       getnotification: function (req, res){
                  var output={}; 
                  var input = JSON.parse(JSON.stringify(req.body));
                  QUERY = "UPDATE "+config_constant.NOTIFICATION+"  SET status='"+input.status+"' WHERE member_no='"+input.member_no+"'";
                   req.app.get('connection').query(QUERY, function(err, rows, fields){
                    if(err){
                      if(config.debug){
                        req.app.get('global').fclog("Error Updating : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error}); return false;
                      }
                    }
                    else{
                      output.timestamp = req.query.timestamp;
                      output.status = message.success;
                      output.comments = message.success;
                      output.update_user_list = rows;
                      res.json(output);
                    }
                  });
                 }
               }