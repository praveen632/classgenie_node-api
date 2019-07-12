var _ = require('underscore');
var url = require('url');
var mongo_connection = require('../common/mongo_connection');
var config = require('../common/config');
var _global = require('../common/global');
var message = require('../assets/json/' + (config.env == 'development' ? 'message' : 'message.min') + '.json');
var _ = require('underscore');
var moment = require('moment-timezone');
var config_constant = require('../common/config_constant');
var filename = config_constant.EVENT_RESPONSIBILTY;
var serialize = require('node-serialize');
module.exports = { 
    /**
     * Create event .
     *
     * @param req, res
     * @return response
     */

    create_event: function (req, res) {
        
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/create_event');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
      
        if (typeof input.event_name != 'undefined') {
            SET += " event_name=?, ";
            data.push(input.event_name.trim());
        }

        if (typeof input.school_id != 'undefined') {
            SET += " school_id=?, ";
            data.push(input.school_id.trim());
        }
        if (typeof input.event_description != 'undefined') {
            SET += " description=?, ";
            data.push(input.event_description.trim());
        }
        if (typeof input.member_no != 'undefined') {
            SET += " teacher_ac_no=?, ";
            data.push(input.member_no.trim());
        }
        if (typeof input.no_of_valunteer != 'undefined') {
            SET += " no_of_volunteer=?, ";
            data.push(input.no_of_valunteer.trim());
        }
        if (typeof input.status != 'undefined') {
            SET += " status=?, ";
            data.push(input.status.trim());
        }
        if (typeof input.responsibilty != 'undefined') {
            SET += " volunteer_responsibility=?, ";
            data.push(input.responsibilty.trim());
        }
       SET = SET.trim().substring(0, SET.trim().length - 1);
       QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
       req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
               if(err){
         if(config.debug){
              req.app.get('global').fclog("Error selecting : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
            }
          }else{
            device_id = [];
            _.each(rows_device_id, function(item){
            if(item.device_id != 0){
                device_id += ','+"'"+item.device_id+"'";
           }
         });
        if(device_id != ''){
             device_id = device_id.substring(1);
        }
         
        
        var start_date = moment(input.day_monthly).format("YYYY-MM-DD");
        var CurrentDate = moment().format("YYYY-MM-DD");
        if (CurrentDate > start_date) {
            output.status = 'Failure';
            output.comments = 'Start date should be greater or equal to current date';
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
            res.json(output);
        }
         
        QUERY = "INSERT INTO " + config_constant.EVENT + " SET " + SET + ", created_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' " + ", update_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " '";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Inserting4 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }

            /*...........get date monthly,weekly,weekend of month for event here............*/

            switch (input.scheduleValue) {
                case "m":
                    var value = '';
                    var n = '11';
                   
                    for (var i = 0; i <= n; i++)
                    {
                        var start_date = moment(input.day_monthly).add(i, 'M').format('YYYY-MM-DD');
                        value += "('" + rows.insertId + "','monthly','" + start_date+' '+input.starttime + "','" + end_date+' '+input.endtime + "'),";
                    }
                    if (value != '') {
                        value = value.substring(0, value.length - 1);
                    }
              
                    QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + " (event_id,token,start_date,end_date) Values" + value;
                    
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Inserting2 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                    });
                    break;
                case "w":                 
                    var CurrentDate = moment().format("YYYY-MM-DD");
                    if (typeof input.day_weekly != 'undefined') {
                        var fullday = input.day_weekly;
                    }
                    var day = moment().day(fullday).toString();
                    var formatDate = moment(day).format("YYYY-MM-DD");

                    var date = moment(formatDate);
                   
                    var dow = date.day();
                    var my_date = formatDate.split('-');
                    var year = parseInt(my_date[0]);
                    var month = parseInt(my_date[1]) - 1;
                    var dates = [];
                    for (var i = 1; i <= 1+ new Date(year, month, 0).getDate(); i++)
                    {
                        var date = new Date(year, month, i);
                      
                        var origDate = moment(date).format("YYYY-MM-DD");
                        if (dow == date.getDay())
                        {
                            if (origDate >= CurrentDate) {
                                dates.push(origDate);
                            }
                        }


                    }
                   
                    var value2 = "";
                    _.forEach(dates, function (value, key) {
                         value2 += "('" + rows.insertId + "','weekly','" + value+' '+input.starttime  + "','" + value+' '+input.endtime + "','" + input.starttime + "','"+input.endtime+"'),";
                     
                    });
                     if (value2 != '') {
                        value2 = value2.substring(0, value2.length - 1);
                    }
               
                    QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + " (event_id,token,start_date,end_date,start_time,end_time) Values" + value2;                    
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Inserting2 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                    });
                    break;
                case "lw":
                    var CurrentDate = moment().format("YYYY-MM-DD");
                    
                        var fullday ='Saturday';
                   
                    var day = moment().day(fullday).toString();
                    var formatDate = moment(day).format("YYYY-MM-DD");
                    var date = moment(formatDate);
                    var dow = date.day();
                    var my_date = formatDate.split('-');
                    var year = parseInt(my_date[0]);
                    var month = parseInt(my_date[1]) - 1;
                    var dates = [];
                    if (dow == 0 || dow == 6) {
                        for (var i = 0; i <= new Date(year, month, 0).getDate(); i++)
                        {
                            var date = new Date(year, month, i);
                            var origDate = moment(date).format("YYYY-MM-DD");

                            if (dow == date.getDay())
                            {
                                if (origDate >= CurrentDate) {
                                    dates.push(origDate);
                                }
                            }


                        }
                    }
                    if (dates.length > 0) {
                        var start_date = dates.pop();
                    }else{
                      var start_date = moment(day).format("YYYY-MM-31");
                    }
                    
                    QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + "(event_id,token,start_date,end_date,start_time,end_time) Values ('" + rows.insertId + "','weekend','" + start_date+' '+input.starttime  + "','" + start_date+' '+input.endtime + "','" + start_time + "','')";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Inserting2 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                    });
                    break;
                default:
                {


                    QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + "(event_id,token,start_date,end_date) Values ('" + rows.insertId + "','datewise','" + input.startDate+' '+input.starttime  + "','" + input.endDate + ' ' + input.endtime + "')";
                  
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Inserting : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                    });
                }
            }
            QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE school_id = '"+input.school_id+"' AND status > '0' ";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting10 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                member_no = [];
               _.each(rows, function(item){
                   member_no += ','+"'"+item.member_no+"'";
               });
               if(member_no != ''){
                member_no = member_no.substring(1);
               }
               if(_.size(member_no) > 0){                
                QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                req.app.get('connection').query(QUERY, function(err, rows, fields){
               
                if(err){
                   if(config.debug){
                          req.app.get('global').fclog("Error Selecting : %s ",err);
                          res.json({error_code:1, error_msg:message.technical_error});
                          return false;
                        }
                 }
                 if (typeof input.message == 'undefined' || input.message == "") {
                       input.message = "New event from Classgenie";
                 }else{
                            input.message = _global.cutString(input.message, 30)+'..';
                }
                _.each(rows, function(item){
                if (config.env === 'production'){
                     _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, member_no:member_no});
                  }
                });
             });
           }
       });
        output.status = message.success;
        output.comments = message.success;
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
        res.json(output);
        });
      }
    });
 },

    /**
     * Edit event .
     *
     * @param req, res
     * @return response
     */

    edit_event: function (req, res) {
		mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/create_event');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));       
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
               if(err){
         if(config.debug){
              req.app.get('global').fclog("Error selecting : %s ",err);
              res.json({error_code:1, error_msg:message.technical_error});
              return false;
            }
          }else{
            device_id = [];
            _.each(rows_device_id, function(item){
            if(item.device_id != 0){
                device_id += ','+"'"+item.device_id+"'";
           }
         });
        if(device_id != ''){
             device_id = device_id.substring(1);
        }
       
        var start_date = moment(input.start_date).format("YYYY-MM-DD");
        var start_time = moment(input.start_date).format("HH:mm:ss");
        var CurrentDate = moment().format("YYYY-MM-DD");

        if (CurrentDate > start_date) {
            output.status = 'Failure';
            output.comments = 'Start date should be greater or equal to current date';
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
            res.json(output);
        }
        QUERY = "UPDATE "+config_constant.EVENT+" SET event_name = '"+input.event_name+"', 	description = '"+input.description+"', school_id = '"+input.school_id+"', teacher_ac_no = '"+input.member_no+"', no_of_volunteer = '"+input.no_of_valunteer+"', volunteer_responsibility = '"+input.responsibilty+"',  update_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE id = '"+input.event_id+"' ";               
    	   req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
           if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error updateting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {                                         
                QUERY = "UPDATE "+config_constant.EVENT_SCHEDULER+" SET start_date = '"+input.startDate+ ' '+input.starttime+"', end_date = '"+input.endDate+ ' '+input.endtime+"', token = 'datewise'   WHERE event_id = '"+input.event_id+"' ";
                req.app.get('connection').query(QUERY, data, function (err, rows6, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error updateting2 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }                            
                    //send notification
                    QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE school_id = '"+input.school_id+"' AND status > '0' ";
                    req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                         if(err){
                            if(config.debug){
                                req.app.get('global').fclog("Error Selecting10 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                        member_no = [];
                       _.each(rows, function(item){
                           member_no += ','+"'"+item.member_no+"'";
                       });
                       if(member_no != ''){
                        member_no = member_no.substring(1);
                       }
                      
                       if(_.size(member_no) > 0){                
                        QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
                        req.app.get('connection').query(QUERY, function(err, rows, fields){
                         if(err){
                           if(config.debug){
                                  req.app.get('global').fclog("Error Selecting : %s ",err);
                                  res.json({error_code:1, error_msg:message.technical_error});
                                  return false;
                                }
                         }
                         if (typeof input.message == 'undefined' || input.message == "") {
                               input.message = "New event from Classgenie";
                         }else{
                                    input.message = _global.cutString(input.message, 30)+'..';
                        }
                        _.each(rows, function(item){
                        if (config.env === 'production'){
                             _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, member_no:member_no});
                          }
                        });
                     });
                   }
               });// end notification
                
          });  
        }
        output.status = message.success;
        output.comments = message.success;
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
  	   res.json(output);

        });
       }
      });

    },

    // edit_event: function (req, res) {
    //     mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/create_event');
    //     var data = [], output = {};
    //     var SET = "";
    //     var input = JSON.parse(JSON.stringify(req.body));
       
    //     if (typeof input.event_name != 'undefined') {
    //         SET += " event_name=?, ";
    //         data.push(input.event_name.trim());
    //     }
    //     if (typeof input.event_description != 'undefined') {
    //         SET += " description=?, ";
    //         data.push(input.event_description.trim());
    //     }
 
    //     if (typeof input.school_id != 'undefined') {
    //         SET += " school_id=?, ";
    //         data.push(input.school_id.trim());
    //     }
    //     if (typeof input.member_no != 'undefined') {
    //         SET += " teacher_ac_no=?, ";
    //         data.push(input.member_no.trim());
    //     }
    //     if (typeof input.no_of_valunteer != 'undefined') {
    //         SET += " no_of_volunteer=?, ";
    //         data.push(input.no_of_valunteer.trim());
    //     }
       
    //     if (typeof input.responsibilty != 'undefined') {
    //         SET += " volunteer_responsibility=?, ";
    //         data.push(input.responsibilty.trim());
    //     }
       
    //     SET = SET.trim().substring(0, SET.trim().length - 1);
    //     QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
    //     req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
    //            if(err){
    //      if(config.debug){
    //           req.app.get('global').fclog("Error selecting : %s ",err);
    //           res.json({error_code:1, error_msg:message.technical_error});
    //           return false;
    //         }
    //       }else{
    //         device_id = [];
    //         _.each(rows_device_id, function(item){
    //         if(item.device_id != 0){
    //             device_id += ','+"'"+item.device_id+"'";
    //        }
    //      });
    //     if(device_id != ''){
    //          device_id = device_id.substring(1);
    //     }
       
    //     var start_date = moment(input.start_date).format("YYYY-MM-DD");
    //     var start_time = moment(input.start_date).format("HH:mm:ss");
    //     var CurrentDate = moment().format("YYYY-MM-DD");

    //     if (CurrentDate > start_date) {
    //         output.status = 'Failure';
    //         output.comments = 'Start date should be greater or equal to current date';
    //         mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
    //         res.json(output);
    //     }

    //     QUERY = "insert into " + config_constant.EVENT + " SET " + SET + ", created_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' " + ", update_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " '";               
      
    //     req.app.get('connection').query(QUERY, data, function (err, rows, fields) {

    //         if (err) {
    //             if (config.debug) {
    //                 req.app.get('global').fclog("Error updateting : %s ", err);
    //                 res.json({error_code: 1, error_msg: message.technical_error});
    //                 return false;
    //             }
    //         } else {
    //             QUERY = "DELETE FROM " + config_constant.EVENT + " WHERE id = '" + input.event_id + "' ";
    //             req.app.get('connection').query(QUERY, data, function (err, deleteRows, fields) {
    //                 if (err) {
    //                     if (config.debug) {
    //                         req.app.get('global').fclog("Error in Deleting: %s", err);
    //                         res.json({error_code: 1, error_msg: message.technical_error});
    //                         return false;
    //                     }
    //                 } else {

    //                     QUERY = "DELETE FROM " + config_constant.EVENT_VOLUNTEER + " WHERE event_id = '" + input.event_id + "' ";
    //                     req.app.get('connection').query(QUERY, data, function (err, rows11, fields) {
    //                         if (err) {
    //                             if (config.debug) {
    //                                 req.app.get('global').fclog("Error in Deleting: %s", err);
    //                                 res.json({error_code: 1, error_msg: message.technical_error});
    //                                 return false;
    //                             }
    //                         }else{
    //                           QUERY = "INSERT INTO " + config_constant.EVENT_VOLUNTEER + " SET event_id = '"+rows.insertId+"', member_no = '"+input.member_no+"', status = '1', created_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' " + ", update_date=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " '   ";
                            
    //                           req.app.get('connection').query(QUERY, data, function (err, rows11, fields) {
    //                                 if (err) {
    //                                     if (config.debug) {
    //                                         req.app.get('global').fclog("Error in Deleting: %s", err);
    //                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                         return false;
    //                                     }
    //                                 }
    //                          else {
    //                             QUERY = "DELETE FROM " + config_constant.EVENT_SCHEDULER + " WHERE event_id = '" + input.event_id + "' ";
    //                             req.app.get('connection').query(QUERY, data, function (err, deleteRows, fields) {
    //                                 if (err) {
    //                                     if (config.debug) {
    //                                         req.app.get('global').fclog("Error in Deleting: %s", err);
    //                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                         return false;
    //                                     }
    //                                 } else {
    //                                     switch (input.scheduleValue) {
    //                                         case "m":                                               
    //                                             var value = '';
    //                                             var n = '11';
    //                                             for (var i = 0; i <= n; i++)
    //                                             {
    //                                                 var start_date = moment(input.day_monthly).add(i, 'M').format('YYYY-MM-DD');
    //                                                 value += "('" + rows.insertId + "','monthly','" + start_date+' '+input.starttime  + "','" + start_date+' '+input.endtime + "','" + start_time + "',''),";
    //                                             }
    //                                             if (value != '') {
    //                                                 value = value.substring(0, value.length - 1);
    //                                             }
    //                                             QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + " (event_id,token,start_date,end_date,start_time,end_time) Values" + value;
    //                                           // console.log(QUERY);return;
    //                                             req.app.get('connection').query(QUERY, data, function (err, rows3, fields) {
    //                                                 if (err) {
    //                                                     if (config.debug) {
    //                                                         req.app.get('global').fclog("Error Inserting 1: %s ", err);
    //                                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                                         return false;
    //                                                     }
    //                                                 }
    //                                             });
    //                                             break;
    //                                         case "w":
    //                                             var CurrentDate = moment().format("YYYY-MM-DD");
    //                                             if (typeof input.day_weekly != 'undefined') {
    //                                                 var fullday = input.day_weekly;
    //                                             }
    //                                             var day = moment().day(fullday).toString();
    //                                             var formatDate = moment(day).format("YYYY-MM-DD");

    //                                             var date = moment(formatDate);
    //                                             var dow = date.day();
    //                                             var my_date = formatDate.split('-');
    //                                             var year = parseInt(my_date[0]);
    //                                             var month = parseInt(my_date[1]) - 1;
    //                                             var dates = [];
    //                                             for (var i = 1; i <= 1+ new Date(year, month, 0).getDate(); i++)
    //                                             {
    //                                                 var date = new Date(year, month, i);
    //                                                 var origDate = moment(date).format("YYYY-MM-DD");
    //                                                 if (dow == date.getDay())
    //                                                 {
    //                                                     if (origDate >= CurrentDate) {
    //                                                         dates.push(origDate);
    //                                                     }
    //                                                 }


    //                                             }
    //                                             //console.log(dates);return;
    //                                             var value2 = "";
    //                                             _.forEach(dates, function (value, key) {
    //                                                 value2 += "('" + rows.insertId + "','weekly','" + value+' '+input.starttime  + "','" + value+' '+input.endtime + "','" + input.starttime + "','"+input.endtime+"'),";
    //                                             });

    //                                             if (value2 != '') {
    //                                                 value2 = value2.substring(0, value2.length - 1);
    //                                             }
    //                                            // console.log(value2);return;
    //                                             QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + " (event_id,token,start_date,end_date,start_time,end_time) Values" + value2;
    //                                             // console.log(QUERY);return;
    //                                             req.app.get('connection').query(QUERY, data, function (err, rows4, fields) {
    //                                                 if (err) {
    //                                                     if (config.debug) {
    //                                                         req.app.get('global').fclog("Error Inserting weekly : %s ", err);
    //                                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                                         return false;
    //                                                     }
    //                                                 }
    //                                             });
    //                                             break;
    //                                         case "lw":
    //                                             var CurrentDate = moment().format("YYYY-MM-DD");
    //                                             var fullday ='Saturday';
    //                                             var day = moment().day(fullday).toString();
    //                                             var formatDate = moment(day).format("YYYY-MM-DD");
    //                                             var date = moment(formatDate);
    //                                             var dow = date.day();
    //                                             var my_date = formatDate.split('-');
    //                                             var year = parseInt(my_date[0]);
    //                                             var month = parseInt(my_date[1]) - 1;
    //                                             var dates = [];
    //                                             if (dow == 0 || dow == 6) {
    //                                                 for (var i = 1; i <= 1+ new Date(year, month, 0).getDate(); i++)
    //                                                 {
    //                                                     var date = new Date(year, month, i);
    //                                                     var origDate = moment(date).format("YYYY-MM-DD");

    //                                                     if (dow == date.getDay())
    //                                                     {
    //                                                         if (origDate >= CurrentDate) {
    //                                                             dates.push(origDate);
    //                                                         }
    //                                                     }


    //                                                 }
    //                                             }

    //                                             if (dates.length > 0) {
    //                                                 var start_date = dates.pop();
    //                                             }

    //                                             QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + "(event_id,token,start_date,end_date,start_time,end_time) Values ('" + rows.insertId + "','weekend','" + start_date+' '+input.starttime  + "','" +start_date+' '+input.endtime + "','" + input.starttime + "','"+input.endtime+"')";
    //                                             req.app.get('connection').query(QUERY, data, function (err, rows5, fields) {
    //                                                 if (err) {
    //                                                     if (config.debug) {
    //                                                         req.app.get('global').fclog("Error Inserting 2: %s ", err);
    //                                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                                         return false;
    //                                                     }
    //                                                 }
    //                                             });
    //                                             break;
    //                                         default:
    //                                         {
                                               
    //                                         QUERY = "INSERT INTO " + config_constant.EVENT_SCHEDULER + "(event_id,token,start_date,end_date,start_time,end_time) Values ('" + rows.insertId + "','datewise','" + input.startDate + "','"+input.endDate+"','" + input.starttime + "','"+input.endtime+"')";
                                               
    //                                             req.app.get('connection').query(QUERY, data, function (err, rows6, fields) {
    //                                                 if (err) {
    //                                                     if (config.debug) {
    //                                                         req.app.get('global').fclog("Error Inserting3 : %s ", err);
    //                                                         res.json({error_code: 1, error_msg: message.technical_error});
    //                                                         return false;
    //                                                     }
    //                                                 }
    //                                             });
    //                                         }
    //                                     }
    //                                 }
    //                                 //send notification
    //                                 QUERY = "SELECT member_no FROM "+config_constant.EDUSER+" WHERE school_id = '"+input.school_id+"' AND status > '0' ";
    //                                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
    //                                      if(err){
    //                                         if(config.debug){
    //                                             req.app.get('global').fclog("Error Selecting10 : %s ", err);
    //                                             res.json({error_code: 1, error_msg: message.technical_error});
    //                                             return false;
    //                                         }
    //                                     }
    //                                     member_no = [];
    //                                    _.each(rows, function(item){
    //                                        member_no += ','+"'"+item.member_no+"'";
    //                                    });
    //                                    if(member_no != ''){
    //                                     member_no = member_no.substring(1);
    //                                    }
                                      
    //                                    if(_.size(member_no) > 0){                
    //                                     QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")";
    //                                     req.app.get('connection').query(QUERY, function(err, rows, fields){
    //                                      if(err){
    //                                        if(config.debug){
    //                                               req.app.get('global').fclog("Error Selecting : %s ",err);
    //                                               res.json({error_code:1, error_msg:message.technical_error});
    //                                               return false;
    //                                             }
    //                                      }
    //                                      if (typeof input.message == 'undefined' || input.message == "") {
    //                                            input.message = "New event from Classgenie";
    //                                      }else{
    //                                                 input.message = _global.cutString(input.message, 30)+'..';
    //                                     }
    //                                     _.each(rows, function(item){
    //                                     if (config.env === 'production'){
    //                                          _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id, member_no:member_no});
    //                                       }
    //                                     });
    //                                  });
    //                                }
    //                            });// end notification
    //                         });
    //                     }
    //                 });
    //                }
    //              });
    //             }
    //         });
    //     }
    //     output.status = message.success;
    //     output.comments = message.success;
    //     mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'event_responsibilty/create_event');
    //     res.json(output);
    //     });
    //    }
    //   });

    // },


    /**
     * Display event listing.
     *
     * @param req, res
     * @return response
     */
    eventList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'event_responsibilty/list');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {}, event_list = [];
        // var page_size = req.app.get('config').page_size;
        // var start_record_index = (query_str.page_number - 1) * page_size;
        // var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;

          // if(typeof query_str.source != 'undefined' && query_str.source==''){
          //           search += " OR Date(start_date) = CURDATE() AND Date(end_date) >= CURDATE() OR Date(start_date) > CURDATE() OR Date(start_date) < CURDATE() ORDER BY start_date,end_date ";
          // }


         if(typeof query_str.source != 'undefined' && query_str.source=='ongoing'){
                    search += " AND CURDATE() BETWEEN Date(start_date) AND Date(end_date) ";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='upcomming'){
                    search += " AND Date(start_date) > CURDATE() ORDER BY start_date,end_date";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='previous'){
                    search += "AND Date(start_date) < CURDATE() AND Date(end_date) < CURDATE() ORDER BY start_date,end_date";
          }

        QUERY = "SELECT * FROM " + config_constant.EVENT + " where school_id = '"+query_str.school_id+"'";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var event_id = '';
           
            _.each(rows, function (item) {
                //output.event_list.push(item);
                event_id += ',' + "'" + item.id + "'";
            });
            if (event_id != '') {
                event_id = event_id.substring(1);
            }          
            if(_.size(event_id) > 0){				
		    var CurrentDate = moment().format("YYYY-MM-DD");
             if(typeof query_str.source != 'undefined' && query_str.source==''){
               QUERY = "SELECT *, date_format(start_date, '%Y/%m/%d %H:%i:%s') as 'start_date1', date_format(end_date, '%Y/%m/%d %H:%i:%s') as 'end_date1' FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN (" + event_id + ") AND CURDATE() BETWEEN Date(start_date) AND Date(end_date) ";
              
              req.app.get('connection').query(QUERY, function (err, rows_c, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting2 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                QUERY = "SELECT *, date_format(start_date, '%Y/%m/%d %H:%i:%s') as 'start_date1', date_format(end_date, '%Y/%m/%d %H:%i:%s') as 'end_date1' FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN (" + event_id + ") AND Date(start_date) > CURDATE() ORDER BY start_date,end_date ";
              req.app.get('connection').query(QUERY, function (err, rows_d, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting2 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
             QUERY = "SELECT *, date_format(start_date, '%Y/%m/%d %H:%i:%s') as 'start_date1', date_format(end_date, '%Y/%m/%d %H:%i:%s') as 'end_date1' FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN (" + event_id + ") AND Date(start_date) < CURDATE() AND Date(end_date) < CURDATE()";
              req.app.get('connection').query(QUERY, function (err, rows_o, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting2 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                var rowss = rows_d.concat(rows_o);
               var rows2 = rows_c.concat(rowss);
               
               output.event_details = [];
               _.each(rows2, function (item) {
               output.event_details.push(item); 
                     //output.event_details[item.event_id] = item.rows2;
           });

            var volunteer_node = {};
            QUERY = "SELECT event_id, COUNT(event_id) as total_event_volunteer FROM " + config_constant.EVENT_VOLUNTEER + " where event_id IN(" + event_id + ")  AND (status = '1') group by event_id";
            req.app.get('connection').query(QUERY, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting2 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                _.each(rows1, function (item, index) {
                    volunteer_node[item.event_id] = item.total_event_volunteer;
                });
                    
                _.each(output.event_details, function (item, index) {
                    if (typeof volunteer_node[item.event_id] != 'undefined') {
                        output.event_details[index]['total_volunteer_count'] = volunteer_node[item.event_id];
                    } else {
                        output.event_details[index]['total_volunteer_count'] = '0';
                    }
                });
                    QUERY = "SELECT * FROM " + config_constant.EVENT + " where school_id = '"+query_str.school_id+"'";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting1 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                    
                    var event_detail = [];                  
                    _.each(rows, function (item) {                      
                        if (typeof event_detail[item.id] == "undefined") {
                            event_detail[item.id] = [];
                        }
                            event_detail[item.id].push(item);
                    });
                                        
                     _.each(output.event_details, function (item, index) {                      
                        if (typeof event_detail != 'undefined') {
                           output.event_details[index]['event_list'] = event_detail[item.event_id];
                        } else {
                            output.event_details[index]['event_list'] = [];
                        }

                    });
                    
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');

                    res.json(output);
               });
          });
        });
     });
  });
     }else{
              QUERY = "SELECT *, date_format(start_date, '%Y/%m/%d %H:%i:%s') as 'start_date1', date_format(end_date, '%Y/%m/%d %H:%i:%s') as 'end_date1' FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN (" + event_id + ") "+search+" ";
        
            req.app.get('connection').query(QUERY, function (err, rows2, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting3 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
             
                output.event_details = [];
                _.each(rows2, function (item) {
                     output.event_details.push(item); 
                     //output.event_details[item.event_id] = item.rows2;
                 });
                

                
        var volunteer_node = {};
        QUERY = "SELECT event_id, COUNT(event_id) as total_event_volunteer FROM " + config_constant.EVENT_VOLUNTEER + " where event_id IN(" + event_id + ")  AND (status = '1') group by event_id";
        req.app.get('connection').query(QUERY, function (err, rows1, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting2 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            _.each(rows1, function (item, index) {
                volunteer_node[item.event_id] = item.total_event_volunteer;
            });

            _.each(output.event_details, function (item, index) {
                if (typeof volunteer_node[item.id] != 'undefined') {
                    output.event_details[index]['total_volunteer_count'] = volunteer_node[item.id];
                } else {
                    output.event_details[index]['total_volunteer_count'] = '0';
                }
            });
                QUERY = "SELECT * FROM " + config_constant.EVENT + " where school_id = '"+query_str.school_id+"'";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting1 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                
                var event_detail = [];                  
                _.each(rows, function (item) {                      
                    if (typeof event_detail[item.id] == "undefined") {
                        event_detail[item.id] = [];
                    }
                        event_detail[item.id].push(item);
                });
                                    
                 _.each(output.event_details, function (item, index) {                      
                    if (typeof event_detail != 'undefined') {
                       output.event_details[index]['event_list'] = event_detail[item.event_id];
                    } else {
                        output.event_details[index]['event_list'] = [];
                    }

                });
                
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                res.json(output);
           });
      });
    });
  }                
    }else{
       res.json({'status':message.failure, 'comments':message.nodata}); 
    }
   });
    },

    /**
     * Display event listing for student .
     *
     * @param req, res
     * @return response
     */
    eventStudentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'event_responsibilty/list');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {};
        var page_size = req.app.get('config').page_size;
        var start_record_index = (query_str.page_number - 1) * page_size;
        var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
       
        if(typeof query_str.source != 'undefined' && query_str.source=='ongoing'){
                    search += " AND start_date = CURDATE() ";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='upcommig'){
                    search += " AND start_date > CURDATE() ORDER BY start_date ";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='select'){
                    search += " ";
          }
       
        QUERY = "SELECT * FROM " + config_constant.EVENT + " where school_id='" + query_str.school_id + "' ORDER BY id ASC ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting11 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var event_id = '';
            output.event_student_list = [];
            _.each(rows, function (item) {
                output.event_student_list.push(item);
                event_id += ',' + "'" + item.id + "'";
            });
            if (event_id != '') {
                event_id = event_id.substring(1);
            }
            if(_.size(event_id) > 0){
            var volunteer_node = {};
            QUERY = "SELECT event_id, COUNT(event_id) as total_event_volunteer FROM " + config_constant.EVENT_VOLUNTEER + " where event_id IN(" + event_id + ")  AND (status = '1') group by event_id ";
            req.app.get('connection').query(QUERY, function (err, rows1, fields) {
                var satrt_date_node = {};
                QUERY = "SELECT * FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN(" + event_id + ")";
                req.app.get('connection').query(QUERY, function (err, rows2, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting1 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    _.each(rows1, function (item, index) {
                        volunteer_node[item.event_id] = item.total_event_volunteer;
                    });

                    _.each(output.event_student_list, function (item, index) {
                        if (typeof volunteer_node[item.id] != 'undefined') {
                            output.event_student_list[index]['total_volunteer_count'] = volunteer_node[item.id];
                        } else {
                            output.event_student_list[index]['total_volunteer_count'] = '0';
                        }
                    });
                    QUERY = "SELECT event_id, start_date, end_date, token FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN(" + event_id + ") "+search+" ";
                    req.app.get('connection').query(QUERY, function (err, rows2, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting10 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                        var start_date_node = {};
                        _.each(rows2, function (item) {
                            if (typeof start_date_node[item.event_id] == "undefined") {
                                start_date_node[item.event_id] = [];
                            }
                            start_date_node[item.event_id].push(item);
                        });

                        _.each(output.event_student_list, function (item, index) {
                            if (typeof start_date_node[item.id] != 'undefined') {
                             
                                output.event_student_list[index]['event_start_date'] = start_date_node[item.id];
                            } else {
                                output.event_student_list[index]['event_start_date'] = [];
                            }

                        });
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                        res.json(output);
                    });
                });
            });
        }else{
            res.json({'status':message.failure, 'comments':message.nodata});
        }
        });
    },

    /**
     * Display event listing for parent.
     *
     * @param req, res
     * @return response
     */
    eventParentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'event_responsibilty/list');
        var query_str = url.parse(req.url, true).query;
        //var start = query_str.start;
        var search = '';
        var data = [], id = [], output = {};
        var page_size = req.app.get('config').page_size;
        var start_record_index = (query_str.page_number - 1) * page_size;
        var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
        
        if(typeof query_str.source != 'undefined' && query_str.source=='ongoing'){
                    search += " AND start_date = CURDATE() ";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='upcommig'){
                    search += " AND start_date > CURDATE() ORDER BY start_date ";
          }

          if(typeof query_str.source != 'undefined' && query_str.source=='select'){
                    search += " ";
          }

        QUERY = "SELECT * FROM " + config_constant.EVENT + " WHERE school_id = '"+query_str.school_id+"' ORDER BY id ASC ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var event_id = '';
            output.event_parent_list = [];
            _.each(rows, function (item) {
                output.event_parent_list.push(item);
                event_id += ',' + "'" + item.id + "'";
            });
            if (event_id != '') {
                event_id = event_id.substring(1);
            }
            if(_.size(event_id) > 0){
            var volunteer_node = {};
            QUERY = "SELECT event_id, COUNT(event_id) as total_event_volunteer FROM " + config_constant.EVENT_VOLUNTEER + " where event_id IN(" + event_id + ")  AND (status = '1') group by event_id ";
            req.app.get('connection').query(QUERY, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting10 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                _.each(rows1, function (item, index) {
                    volunteer_node[item.event_id] = item.total_event_volunteer;
                });

                _.each(output.event_parent_list, function (item, index) {
                    if (typeof volunteer_node[item.id] != 'undefined') {
                        output.event_parent_list[index]['total_volunteer_count'] = volunteer_node[item.id];
                    } else {
                        output.event_parent_list[index]['total_volunteer_count'] = '0';
                    }
                });


                QUERY = "SELECT event_id, start_date, end_date, token FROM " + config_constant.EVENT_SCHEDULER + " where event_id IN(" + event_id + ") "+search+" ";
                req.app.get('connection').query(QUERY, function (err, rows2, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting11 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    var start_date_node = {};
                    _.each(rows2, function (item) {
                        if (typeof start_date_node[item.event_id] == "undefined") {
                            start_date_node[item.event_id] = [];
                        }
                        start_date_node[item.event_id].push(item);
                    });

                    _.each(output.event_parent_list, function (item, index) {
                        if (typeof start_date_node[item.id] != 'undefined') {
                        
                            output.event_parent_list[index]['event_start_date'] = start_date_node[item.id];
                        } else {
                            output.event_parent_list[index]['event_start_date'] = [];
                        }

                    });
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                    res.json(output);
                });
            });
        }else{
           res.json({'status':message.failure, 'comments':message.nodata}); 
        }
      });
    },

    /**
     * make volunteer by parent .
     *
     * @param req, res
     * @return response
     */
    addVolunteer: function (req, res) {
        // mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'event_responsibilty/list');
        // var query_str = url.parse(req.url, true).query;console.log(query_str);
        // var search = '';
        // //var start = query_str.start;
        // var data = [], id = [], output = {};
        // var page_size = req.app.get('config').page_size;
        // var start_record_index = (query_str.page_number - 1) * page_size;
        // var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/create_event');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));

        QUERY = "SELECT count(*) as total FROM " + config_constant.EVENT_VOLUNTEER + " where member_no= '" + input.member_no + "' and event_id='" + input.event_id + "' and status='1'";
    
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            if (rows[0]['total'] > 0) {
               satrt_date_node = [];
                _.each(rows, function (item, index) {
                    satrt_date_node[item.event_id] = item;
                });

                _.each(output.event_list, function (item, index) {
                    if (typeof volunteer_node[item.id] != 'undefined') {
                        output.event_list[index]['start_date'] = satrt_date_node[item.id];
                    } else {
                        output.event_list[index]['start_date'] = '';
                    }
                });


                output.timestamp = req.query.timestamp;
                output.status = 'user_exist';
                res.json(output);
                return false;
            } else {
                QUERY = "INSERT INTO " + config_constant.EVENT_VOLUNTEER + "(event_id,member_no,status,created_date,update_date) Values ('" + input.event_id + "','" + input.member_no + "','1',' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ',' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ')";
            
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        
                        if (config.debug) {
                            req.app.get('global').fclog("Error Inserting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                });
            }
            output.timestamp = req.query.timestamp;
            output.status = message.success;
            output.comments = message.success;
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
            res.json(output);


        });
    },

    /**
     * Display Volunteer listing by event id.
     *
     * @param req, res
     * @return response
     */
    eventVolunteerList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'event_responsibilty/list');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {};
        var page_size = req.app.get('config').page_size;
        var start_record_index = (query_str.page_number - 1) * page_size;
        var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
        QUERY = "SELECT * FROM " + config_constant.EVENT_VOLUNTEER + " where event_id='" + query_str.event_id + "' ORDER BY id desc";
      
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var member_no = '';
            output.volunteer_list = [];
            _.each(rows, function (item) {
                output.volunteer_list.push(item);
                member_no += ',' + "'" + item.member_no + "'";
            });
            if (member_no != '') {
                member_no = member_no.substring(1);
            }

            var member_node = {};
            QUERY = "SELECT member_no,name FROM " + config_constant.EDUSER + " where member_no IN(" + member_no + ")";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting1 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                _.each(rows1, function (item, index) {
                    member_node[item.member_no] = item.name;
                });
            
                _.each(output.volunteer_list, function (item, index) {
                    if (typeof member_node[item.member_no] != 'undefined') {
                        output.volunteer_list[index]['volunteer_member_list'] = member_node[item.member_no];
                    } else {
                        output.volunteer_list[index]['volunteer_member_list'] = '';
                    }
                });
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                res.json(output);

            });
        });
    },

    /**
     * Update assignment by teacher.
     *
     * @param req, res
     * @return response
     */
    deleteEvent: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event_responsibilty/delete');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.id != 'undefined') {
            SET += " id=?, ";
        }

        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "DELETE FROM " + config_constant.EVENT + " WHERE id = '" + input.id + "' ";
		
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Deleting: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "DELETE FROM " + config_constant.EVENT_VOLUNTEER + " WHERE event_id = '" + input.id + "' ";
				
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error in Deleting: %s", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {

                        QUERY = "DELETE FROM " + config_constant.EVENT_SCHEDULER + " WHERE event_id = '" + input.id + "' ";
					    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Deleting: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                output.status = message.success;
                                output.comments = message.success;
                                res.json(output);
                            }
                        });
                    }
                });
            }
        });
    },

    /**
     * Responsibilty list base on event id.
     *
     * @param req, res
     * @return response
     */
    responsibilty_list: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'event/responsibilty_list_access');
           var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var where = " WHERE 1=1 ";
           if(typeof query_str.event_id != 'undefined'){
                 where += " AND event_id= ? ";
                 data.push(query_str.event_id.trim());
         }
         QUERY = "SELECT volunteer_responsibility FROM "+config_constant.EVENT+" WHERE id = '"+query_str.event_id+"' ";
         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error in Selecting: %s ",err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
             }
             else if(_.size(rows) > 0){
               var id = rows[0]['volunteer_responsibility'];
               QUERY = "SELECT * FROM "+config_constant.EVENT_RESPONSIBILITY+" WHERE id IN ("+id+") ";
               req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                   if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error in Selecting: %s", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                    }
                   }else{
                     output.timestamp = req.query.timestamp;
                     output.status = message.success;
                     output.comments = message.success;
                     output.responsibilty_list = rows;
                     mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'event/responsibilty_list_access');
                     res.json(output);
                   }
                   
               });
             }else{
                 res.json({'status':message.failure, 'comments':message.nodata});
             }              
         });
    },

     /**
     * Date time list base on event id.
     *
     * @param req, res
     * @return response
     */
    date_time_list: function(req, res){
           mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'event/responsibilty_list_access');
           var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var where = " WHERE 1=1 ";
           if(typeof query_str.event_id != 'undefined'){
                 where += " AND event_id= ? ";
                 data.push(query_str.event_id.trim());
         }
       QUERY = "SELECT date_format(start_date, '%b, %d %Y %H:%i') as 'start_date', date_format(end_date, '%b, %d %Y %H:%i') as 'end_date' FROM "+config_constant.EVENT_SCHEDULER+" WHERE event_id = '"+query_str.event_id+"' ";
       req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error in Selecting2: %s ",err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }else{
                 output.timestamp = req.query.timestamp;
                 output.status = message.success;
                 output.comments = message.success;
                 output.date_time_list = rows;
                 mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'event/responsibilty_list_access');
                 res.json(output); 
            }              
         });
    },
   /**
     * Remove event volunteer from parent.
     *
     * @param req, res
     * @return response
     */

    quit_from_volunteer: function(req, res){
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'event/quit_from_volunteer_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.member_no != 'undefined') {
            SET += " member_no=?, ";
        }
        if (typeof input.id != 'undefined') {
            SET += " id=?, ";
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "DELETE FROM " + config_constant.EVENT_VOLUNTEER + " WHERE (member_no = '" + input.member_no + "') OR (id = '"+input.id+"') ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Deleting: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }else{
               output.timestamp = req.query.timestamp;
               output.status = message.success;
               output.comments = message.success;
               mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'event/quit_from_volunteeraccess');
               res.json(output);  
            }
        });
    },
    /**
     * Parent name by evant id.
     *
     * @param req, res
     * @return response
     */
    parent_name: function(req, res){
            mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'event/parent_name_access');
           var query_str = url.parse(req.url,true).query;
           var data = [], output={};
           var where = " WHERE 1=1 ";
           if(typeof query_str.event_id != 'undefined'){
                 where += " AND event_id= ? ";
                 data.push(query_str.event_id.trim());
         }
         QUERY = "SELECT member_no, id FROM "+config_constant.EVENT_VOLUNTEER+" WHERE event_id = '"+query_str.event_id+"' ";
         req.app.get('connection').query(QUERY, data, function(err, rows, fields){
             if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error in Selecting2: %s ",err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
          output.volunteer_list =[];
            var member_no = [];
            _.each(rows, function(item){
                output.volunteer_list.push(item);
               member_no += ','+"'"+item.member_no+"'";
            });
            if(member_no != ''){
                member_no = member_no.substring(1);
            }
           var name = [];
             QUERY = "SELECT name, member_no FROM "+config_constant.EDUSER+" WHERE member_no IN ("+member_no+") AND status > '-1' ";
             req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 _.each(rows, function(item, index){
                    name[item.member_no] = item.name;
                });
                _.each(output.volunteer_list, function(item, index){
                if(typeof name[item.member_no] != 'undefined'){
                    output.volunteer_list[index]['name'] = name[item.member_no];
                }
                });
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;               
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'POST', text:serialize.serialize(output)}, 'event/parent_name_access');
                res.json(output);                
            });
          });

    }

}