var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var moment = require('moment-timezone');
var Base64 = require('js-base64').Base64;
module.exports = {
	     /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
       attendance_report: function(req, res){
       	      mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'attendance/studentlist_access');
              var query_str = url.parse(req.url,true).query;
              var data = [], output={}, rows1 = [];
              var where = " WHERE 1=1 ";	
              var startdate = query_str['date1'];
              var enddate = query_str['date2'];
              if(typeof query_str.student_no == 'undefined'){
                   query_str.student_no =='';
               }
               QUERY = "SELECT * FROM "+config_constant.ATTENDANCE+" WHERE student_no='"+query_str.student_no+"' and created_at BETWEEN '"+startdate+"' and '"+enddate+"'";
			         req.app.get('connection').query(QUERY, function(err, rows, fields){
                  if(err){
                      if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ",err);
                        res.json({error_code:1, error_msg:message.technical_error});
                        return false;
                      }
                    }

                _.each(rows, function(item, index){
                     var student_no = item.student_no;
                     var student_attandence  = item.attendance;
                     var date_attandence = (moment(item.created_at).format("DD/MM/YYYY"));					 
                     rows1[index] = [];
                     rows1[index] = {student_no:student_no, attendance:student_attandence,date:date_attandence};
                     });
                 output.attandence_list =  rows1;
                 output.timestamp = req.query.timestamp;
                 output.status = message.success;
                 output.comments = message.success;
                 res.json(output);
         });
       }
}