
var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/' + (config.env == 'development' ? 'message' : 'message.min') + '.json');
var mongo_connection = require('../common/mongo_connection');
var _global = require('../common/global');
var moment = require('moment-timezone');
var Base64 = require('js-base64').Base64;
var fs = require('fs');
module.exports = {
    /**
     * Display listing of resources.
     *
     * @param req, res
     * @return response
     */
    assignmentPost: function(req, res){		
        var input = JSON.parse(JSON.stringify(req.body));		
        var output = {};
        var data = '';
        var teac = 0;
        var student_no = 0;
        var img1 = '';
        if (!req.file) {
            if (config.debug) {
                req.app.get('global').fclog("No file was uploaded.");
                res.json({error_code: 1, error_msg: message.technical_error});
                return false;
            }
        }        
        var file = req.file;     
        var name = file.originalname.split('.');
        if (file.size > 20 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            res.json({err: 'File greater than 20mb is not allowed'});
            return false;
        }
        if (name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'pptx' || name[1] == 'docx' || name[1] == 'doc' || name[1] == 'pdf') {
            var img = file.originalname;
            var data = fs.readFileSync(file.path);
            fs.writeFile(config.upload_path+'/assignment/' + file.originalname, data);
        }
        var curDate = _global.js_yyyy_mm_dd();
        if (input.title != 'undefined') {
            var title = input.title;
        }
        if (input.description != 'undefined') {
            var description = input.description;
        }
        if (input.submition_date != 'undefined') {
            if (input.submition_date >= curDate) {
                var submition_date = input.submition_date;
            } else {
                var submition_date = curDate;
            }
        }
        if (input.class_id != 'undefined') {
            var class_id = input.class_id;
        }
        if (input.member_no != 'undefined') {
            var member_no = input.member_no;
        }
         QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
         req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
             if(err){
               if(config.debug){
                    req.app.get('global').fclog("Error selecting8 : %s ",err);
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
        QUERY = "INSERT INTO " + config_constant.ASSIGNMENT + " SET attachment=" + "'" + img + "'" + ",title= " + "'" + title + "'" + ",description= " + "'" + description + "'" + ",class_id= " + "'" + class_id + "'" + ",member_no= " + "'" + member_no + "'" + ", created_at= " + "'" + curDate + "'" + ",submition_date= " + "'" + submition_date + "'" + "";
        req.app.get('connection').query(QUERY, function (err, rows, fields)
        {
            var id = rows['insertId'];
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Inserting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            QUERY = "SELECT * FROM " + config_constant.ASSIGNMENT + " where id ='" + id + "'";
            req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting7 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                QUERY = "SELECT student_no FROM " + config_constant.STUDENTINFO + " where class_id ='" + rows2[0]['class_id'] + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows3, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting6 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        var student_no = [];
                        _.each(rows3, function (item) {
                            if (item.student_no != 0) {
                                QUERY = "INSERT INTO " + config_constant.STUDENTASSIGNMENT + " SET assignment_id=" + "'" + id + "'" + ", teacher_ac_no= '" + rows2[0]['member_no'] + "',class_id='" + rows2[0]['class_id'] + "',student_no= '" + item.student_no + "',submition_date= '" + submition_date + "' ";
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Inserting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
	           if (name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'pptx' || name[1] == 'docx' || name[1] == 'doc' || name[1] == 'pdf') {
                    img1 = 'image_' + id + '.' + name[1];
                }
                fs.rename(config.upload_path+'/assignment/' + file.originalname, config.upload_path+'/assignment/' + img1, function (err) {
                    if (err) {
                        req.app.get('global').fclog("Error In rename : %s ", err);
                        return false;
                    }
                });
                QUERY = "UPDATE " + config_constant.ASSIGNMENT + " SET attachment=" + "'" + img1 + "'" + " WHERE id='" + id + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Updating : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " where class_id ='" + input.class_id + "'";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting5: %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                        student_info_id = [];
                        parent_ac_no = [];
                        _.each(rows, function (item) {
                            if (item.parent_ac_no != 0) {
                                parent_ac_no += ',' + item.parent_ac_no;
                            }
                            if (item.id != 0) {
                                student_info_id += ',' + item.id;
                            }
                        });
                        if (parent_ac_no != '') {
                            parent_ac_no = parent_ac_no.substring(1);
                        }

                        if (student_info_id != '') {
                            student_info_id = student_info_id.substring(1);
                        }
                        QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + student_info_id + ") ";
                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Selecting4: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                var student_ac_no = [], student_ac = [];
                                _.each(rows, function (item) {
                                    student_ac_no += ',' + item.student_ac_no;
                                    student_ac += ',' + "'" + item.student_ac_no + "'";
                                });
                                if (student_ac_no != '') {
                                    student_ac_no = student_ac_no.substring(1);
                                }
                                if (student_ac != '') {
                                    student_ac = student_ac.substring(1);
                                }
								
                            }
                            if (parent_ac_no.length > 0 || student_ac_no.length > 0) { 
                                QUERY = "SELECT class_name FROM " + config_constant.CLASSINFO + " where class_id ='" + input.class_id + "'";
                                
								req.app.get('connection').query(QUERY, data, function (err, classNameRows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting3 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }								
                                    QUERY = "SELECT * FROM " + config_constant.NOTIFICATION + " where member_no IN (member_no ='" + parent_ac_no + "' and status = 1) OR (member_no ='" + student_ac_no + "') and status = 1 and device_id NOT IN ("+device_id+") ";
                                    // QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) or (member_no IN ("+student_ac_no+")) or (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")"; 
                                    req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                        if (err) {
                                            if (config.debug) {
                                                req.app.get('global').fclog("Error Selecting2 : %s ", err);
                                                res.json({error_code: 1, error_msg: message.technical_error});
                                                return false;
                                            }
                                        }
                                        if (typeof input.title == 'undefined' || input.title == "") {
                                            input.title = "New Assignment from Classgenie";
                                        }
        								
                                        _.each(rows, function (item) {
                                            if (config.env === 'production') {
                                                _global.pushNotification({module_id: 6, message: _global.cutString(input.title, 20) + '..', title: classNameRows[0]['class_name']+'-Assignment', device_id: item.device_id, member_no: parent_ac_no});
                                            }
                                        });
                                    });
								 });
								 
                                //Update student notification status
								if(_.size(student_ac_no) > '0'){
                                QUERY = "SELECT student_info_id FROM " + config_constant.USERSTUDENTINFO + " WHERE student_ac_no IN (" + student_ac + ")";
                            
								req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error in Selecting4 : %s", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    } else {
                                        var ids = [];
                                        _.each(rows, function (item) {
                                            ids += ',' + "'" + item.student_info_id + "'";
                                        });
                                        if (ids != '') {
                                            ids = ids.substring(1);
                                        }
                                        QUERY = "SELECT student_no FROM " + config_constant.STUDENTINFO + " WHERE id IN (" + ids + ") AND status = '1'";
                                        req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                                            if (err) {
                                                if (config.debug) {
                                                    req.app.get('global').fclog("Error in Selecting4 : %s", err);
                                                    res.json({error_code: 1, error_msg: message.technical_error});
                                                    return false;
                                                }
                                            }
                                            var student_no = [];
                                            _.each(rows1, function (item) {
                                                student_no += ',' + "'" + item.student_no + "'";
                                            });
                                            if (student_no != '') {
                                                student_no = student_no.substring(1);
                                            }
                                            QUERY = "UPDATE " + config_constant.STUDENTASSIGNMENT + " SET notification_status = '1' WHERE student_no IN (" + student_no + ") AND (assignment_id = '" + id + "')  ";
                                            req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                                if (err) {
                                                    if (config.debug) {
                                                        req.app.get('global').fclog("Error in Updating: %s", err);
                                                        res.json({error_code: 1, error_msg: message.technical_error});
                                                        return false;
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });
								}
								
                            }
                        });
                    });
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);
                });
            });
        });
        if (fs.existsSync(config.upload_path+'/assignment/' + img1)) {
            fs.unlinkSync(file.path);
        } else {
            res.json({err: 'Invalid file format!'});
            return false;
        }
    }
});
    },
    /**
     * Display assignment listing.
     *
     * @param req, res
     * @return response
     */
    assignmentList: function (req, res) {
		mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'assignment/list_access');
        var query_str = url.parse(req.url, true).query;
        var search = '';
        var start = query_str.start;
        var data = [], id = [], output = {};
         var page_size = req.app.get('config').page_size;
          var start_record_index = (query_str.page_number - 1) *page_size;
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
          var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by=='A' ? " asc ":" desc ");
        if ((query_str.title != '')  || (query_str.fromDate != '' && query_str.toDate != '')) {
            search = " AND submition_date>='" + query_str.fromDate + "' AND submition_date <= '" + query_str.toDate + "' ";
        }
        //QUERY = "SELECT *, DATE_FORMAT(submition_date,'%d/%m/%Y') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM " + config_constant.ASSIGNMENT + " where class_id='" + query_str.class_id + "' " + search + " ORDER BY ABS( DATEDIFF(submition_date, NOW() ) ) " + limit + " ";
       
       // QUERY ="SELECT a.* FROM ( SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%d/%m/%Y') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM "+config_constant.ASSIGNMENT+" s where s.submition_date >= curdate() and class_id =  '" + query_str.class_id + "' " + search + " ORDER BY s.`submition_date` asc) a UNION  SELECT b.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,DATE_FORMAT(submition_date,'%d/%m/%Y') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM "+config_constant.ASSIGNMENT+" t where t.`submition_date` < curdate() and class_id =  '" + query_str.class_id + "' " + search + " ORDER BY t.submition_date desc) b";
        QUERY1 = "SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date < curdate() and class_id = '"+query_str.class_id+"' " + search + "  ORDER BY `submition_date` desc "+limit+" ";
        req.app.get('connection').query(QUERY1, data, function (err, rows3, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            
            QUERY2 ="SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%Y/%m/%d') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date >= curdate() and class_id =  '" + query_str.class_id + "' " + search + " ORDER BY `submition_date` ASC ";
            req.app.get('connection').query(QUERY2, data, function (err, rows4, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting1 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                } 
            if(typeof rows4 != ''){
              var rows = rows4.concat(rows3); 
           } 
             
            var assignment_id = [], assignment_list = {};
            output.assignment_list = [];
            _.each(rows, function (item) {
                output.assignment_list.push(item);
                assignment_id += ',' + "'" + item.id + "'";
            });
            if (assignment_id != '') {
                assignment_id = assignment_id.substring(1);
            }           
            var status_node = {};
            QUERY = "SELECT assignment_id, COUNT(status) as total_student_submit_count FROM " + config_constant.STUDENTASSIGNMENT + " where assignment_id IN (" + assignment_id + ")  AND (status = '1') group by assignment_id ";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                _.each(rows1, function (item, index) {
                    status_node[item.assignment_id] = item.total_student_submit_count;
                });
                _.each(output.assignment_list, function (item, index) {
                    if (typeof status_node[item.id] != 'undefined') {
                        output.assignment_list[index]['total_student_submit_count'] = status_node[item.id];
                    } else {
                        output.assignment_list[index]['total_student_submit_count'] = '0';
                    }
                });
                QUERY = "SELECT COUNT(student_no) as total_submit_count FROM " + config_constant.STUDENTINFO + " where class_id='" + query_str.class_id + "' ";
                req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting3 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        //output.assignment_list = rows;
                        output.total_submit_count = rows2[0]['total_submit_count'];
                        //output.total_student_submit_count = rows1[0]['total_student_submit_count'];
                        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                        res.json(output);
                    }
                });
            });
        });
    });

    },
    /**
     * Display assignment list by id.
     *
     * @param req, res
     * @return response
     */
    assignmentListById: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'assignment/list_access');
        var query_str = url.parse(req.url, true).query;
        var start = query_str.start;
        var data = [], output = {};
        if (typeof query_str.class_id != 'undefined') {
            data.push(query_str.class_id.trim());
        }
        QUERY = "SELECT *, DATE_FORMAT(submition_date,'%d/%m/%Y') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM " + config_constant.ASSIGNMENT + " where class_id='" + query_str.class_id + "' AND id = '" + query_str.assignmentId + "' ORDER BY id desc ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "SELECT COUNT(student_no) as total_student_submit_count FROM " + config_constant.STUDENTASSIGNMENT + " where class_id='" + query_str.class_id + "' AND status = '1' ";
                req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        QUERY = "SELECT COUNT(student_no) as total_submit_count FROM " + config_constant.STUDENTASSIGNMENT + " where class_id='" + query_str.class_id + "' ";
                        req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error Selecting : %s ", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                output.assignment_list = rows;
                                output.total_submit_count = rows2[0]['total_submit_count'];
                                output.total_student_submit_count = rows1[0]['total_student_submit_count'];
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'addstudent_access');
                                res.json(output);
                            }
                        });
                    }
                });
            }
        });
    },
    /**
     * Update assignment by teacher.
     *
     * @param req, res
     * @return response
     */
    assignmentUpdate: function (req, res) {
        var input = JSON.parse(JSON.stringify(req.body));
        var output = {};
        var data = '';
        var student_no = 0;
        var img1 = '';
        if (!req.file) {
            if (config.debug) {
                req.app.get('global').fclog("No file was uploaded");
                res.json({error_code: 1, error_msg: message.technical_error});
                return false;
            }
        }
        var file = req.file;     
        var name = file.originalname.split('.');
        if (file.size > 20 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            res.json({err: 'File greater than 20mb is not allowed'});
            return false;
        }
        if (name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'pptx' || name[1] == 'docx' || name[1] == 'doc' || name[1] == 'pdf') {
            var img = file.originalname;
            var data = fs.readFileSync(file.path);
            fs.writeFile(config.upload_path+'/assignment/' + file.originalname, data);
        }
        var img = '';
        if (input.id != '') {
            var id = input.id;
        }
        if (name[1] == 'png' || name[1] == 'gif' || name[1] == 'jpg' || name[1] == 'pptx' || name[1] == 'docx' || name[1] == 'doc' || name[1] == 'pdf') {
            img1 = 'image_' + id + '.' + name[1];
        }
        fs.rename(config.upload_path+'/assignment/' + file.originalname, config.upload_path+'/assignment/' + img1, function (err) {
            if (err) {
                req.app.get('global').fclog("Error In rename : %s ", err);
                return false;
            }
        });

        if (input.title != 'undefined') {
            var title = input.title;
        }
        if (input.description != 'undefined') {
            var description = input.description;
        }
        if (input.submition_date != 'undefined') {
            var submition_date = input.submition_date;
        }
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
         if(err){
           if(config.debug){
                req.app.get('global').fclog("Error selecting1 : %s ",err);
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

        QUERY = "UPDATE " + config_constant.ASSIGNMENT + " SET attachment=" + "'" + img1 + "'" + ", title=" + "'" + title + "'" + ", description=" + "'" + description + "'" + ", submition_date= " + "'" + submition_date + "'" + " WHERE id='" + id + "'";
        req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Updating : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            //select Parent_ac_no form input class_id and select device id through parent_ac_no.
            QUERY = "SELECT class_id FROM " + config_constant.ASSIGNMENT + " where id ='" + input.id + "'";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }

                QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " WHERE class_id ='" + rows1[0].class_id + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    parent_ac_no = [], id = [];
                    _.each(rows, function (item) {
                        if (item.parent_ac_no != 0) {
                            parent_ac_no += ',' + item.parent_ac_no;
                            id += ',' + item.id;
                        }
                    });
                    if (id != '') {
                        id = id.substring(1);
                    }
                    if (parent_ac_no != '') {
                        parent_ac_no = parent_ac_no.substring(1);
                    }
                    if(id.length > 0){
                    QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + id + ") ";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error in Selecting4: %s", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        } else {
                            var student_ac_no = [];
                            _.each(rows, function (item) {
                                student_ac_no += ',' + item.student_ac_no;
                            });
                            if (student_ac_no != '') {
                                student_ac_no = student_ac_no.substring(1);
                            }
                        }

                        // check length parent_ac_no in Notification tabel
                        if (parent_ac_no.length > 0 || student_ac_no > 0) {
                        QUERY = "SELECT class_name FROM " + config_constant.CLASSINFO + " where class_id ='" + rows1[0].class_id + "'";
                        req.app.get('connection').query(QUERY, data, function (err, classNameRows, fields) {
                             if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error Selecting3 : %s ", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                  }
                               }									
                               
                                QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and device_id NOT IN ("+device_id+") and status = 1";
                                //QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+")) or (member_no IN ("+student_ac_no+")) or (member_no IN ("+member_no+")) and status = 1 and device_id NOT IN ("+device_id+")"; 
                                
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting2 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                    if (typeof input.title == 'undefined' || input.title == "") {
                                        input.title = "New Post from Classgenie";
                                    }									
                                    _.each(rows, function (item) {
                                        if (config.env === 'production') {
                                            _global.pushNotification({module_id: 6, message: _global.cutString(input.title, 20) + '..', title: classNameRows[0]['class_name']+'-Assignment', device_id: item.device_id, member_no: parent_ac_no});
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
                });
            });
            output.status = message.success;
            output.comments = message.success;
            res.json(output);
        });
        if (fs.existsSync(config.upload_path+'/assignment/' + img)) {
            fs.unlinkSync(file.path);
        } else {
            res.json({err: 'Invalid file format!'});
            return false;
        }
    }
  });
    },

    /**
     * Update assignment data only.
     *
     * @param req, res
     * @return response
     */
    dataUpdateAssignment: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'PUT', text: serialize.serialize(_.extend(req.body, req.query))}, 'classstories/update_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));   
        //condition exectue in insert condition           
        if (input.id == '') {           
             module.exports.saveAssingment(req, res, input);
        } else {
            if (typeof input.title != 'undefined') {
                SET += " title=?, ";
                data.push(input.title.trim());
            }
            if (typeof input.submition_date != 'undefined') {
                SET += " submition_date=?, ";
                data.push(input.submition_date.trim());
            }
            if (typeof input.description != 'undefined') {
                SET += " description=?, ";
                data.push(input.description.trim());
            }			
            SET = SET.trim().substring(0, SET.trim().length - 1);
            QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
            req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
             if(err){
               if(config.debug){
                    req.app.get('global').fclog("Error selecting1 : %s ",err);
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
            QUERY = "UPDATE " + config_constant.ASSIGNMENT + " SET " + SET + " WHERE id='" + input.id + "'";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Updating : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }			
                //select Parent_ac_no form input class_id and select device id through parent_ac_no.
                QUERY = "SELECT class_id FROM " + config_constant.ASSIGNMENT + " where id ='" + input.id + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting2 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " WHERE class_id ='" + rows1[0].class_id + "'";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting3 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                        parent_ac_no = [], id = [];
                        _.each(rows, function (item) {                          
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                                id += ','+"'"+item.id+"'";                            
                        });
                        if (id != '') {
                            id = id.substring(1);
                        }
                        if (parent_ac_no != '') {
                            parent_ac_no = parent_ac_no.substring(1);
                        }                        
                        QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + id + ") ";
                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Selecting11: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                var student_ac_no = [];
                                _.each(rows, function (item) {
                                    student_ac_no += ','+ "'"+item.student_ac_no+"'";
                                });
                                if (student_ac_no != '') {
                                    student_ac_no = student_ac_no.substring(1);
                                }
                            }                           
                            // check length parent_ac_no in Notification tabel
							QUERY = "SELECT class_name FROM " + config_constant.CLASSINFO + " where class_id ='" + rows1[0].class_id + "'";
                            req.app.get('connection').query(QUERY, data, function (err, classNameRows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting4 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }									
								if(_.size(student_ac_no) > 0){
                                 QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and device_id NOT IN ("+device_id+") and status = 1";
                                }else{	
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+parent_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";  
                                }                              
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting5 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                    if (typeof input.title == 'undefined' || input.title == "") {
                                        input.title = "New Post from Classgenie";
                                    }									
                                    _.each(rows, function (item) {
                                        if (config.env === 'production') {
                                            _global.pushNotification({module_id: 6, message: _global.cutString(input.title, 20) + '..', title: classNameRows[0]['class_name']+'-Assignment', device_id: item.device_id, member_no: parent_ac_no});
                                        }
                                    });
                                });
								 });
                            //}
                        });
                    });
                });
                output.status = message.success;
                output.comments = message.success;
                res.json(output);
            });
            }
           });
        }
    },
    /**
     * Save assignment 
     *
     * @param req, res, input
     * @return response 
     */
    saveAssingment: function (req, res, input) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'teacher/update_access');
        var data = [], output = {};
        var SET = "";
        var curDate = _global.js_yyyy_mm_dd();
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, function(err, rows_device_id, fields){
         if(err){
           if(config.debug){
                req.app.get('global').fclog("Error selecting1 : %s ",err);
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
        QUERY = "INSERT INTO " + config_constant.ASSIGNMENT + " SET title = '" + input.title + "', description= '" + input.description + "', class_id= '" + input.class_id + "', member_no= '" + input.member_no + "', created_at='" + curDate + "', submition_date= '" + input.submition_date + "' ";
        req.app.get('connection').query(QUERY, function (err, rows, fields)
        {
            var id = rows['insertId'];
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Inserting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }           
            QUERY = "SELECT * FROM " + config_constant.ASSIGNMENT + " where id ='" + id + "'";
            req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Selecting1 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                QUERY = "SELECT student_no, parent_ac_no, id FROM " + config_constant.STUDENTINFO + " where class_id ='" + rows2[0]['class_id'] + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows3, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting2 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        var student_no = [];
                        var student_info_id = [];
                        var parent_ac_no = [];
                        _.each(rows3, function (item) {
                            if (item.student_no != 0) {
                                QUERY = "INSERT INTO " + config_constant.STUDENTASSIGNMENT + " SET assignment_id='" + id + "', teacher_ac_no= '" + input.member_no + "',class_id='" + input.class_id + "',student_no= '" + item.student_no + "',submition_date= '" + input.submition_date + "' ";
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Inserting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                });
                            }
                            if (item.parent_ac_no != 0) {
                                parent_ac_no += ','+"'"+item.parent_ac_no+"'";
                            }
                            if (item.id != 0) {
                                student_info_id += ','+"'"+item.id+"'";
                            }
                        });
                        if (parent_ac_no != '') {
                            parent_ac_no = parent_ac_no.substring(1);
                        }
                    

                        if (student_info_id != '') {
                            student_info_id = student_info_id.substring(1);
                        }
                        if(_.size(student_info_id) > 0){
                        QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + student_info_id + ") ";
                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Selecting4: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                var student_ac_no = [], student_ac = [];
                                _.each(rows, function (item) {
                                    student_ac_no += ',' + item.student_ac_no;
                                    student_ac += ',' + "'" + item.student_ac_no + "'";
                                });
                                if (student_ac_no != '') {
                                    student_ac_no = student_ac_no.substring(1);
                                }
                                if (student_ac != '') {
                                    student_ac = student_ac.substring(1);
                                }                                
                            }

                           // if (parent_ac_no.length > 0 || student_ac_no.length > 0) {
                                QUERY = "SELECT class_name FROM " + config_constant.CLASSINFO + " where class_id ='" + input.class_id + "'";
                                req.app.get('connection').query(QUERY, data, function (err, classNameRows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting3 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
									if(_.size(parent_ac_no) > 0){
								if(_.size(student_ac_no) > 0){
                                 QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where (member_no IN ("+parent_ac_no+") or member_no IN ("+student_ac_no+")) and device_id NOT IN ("+device_id+") and status = 1";
                                }else{  
                                  QUERY = "SELECT * FROM "+config_constant.NOTIFICATION+" where member_no IN ("+parent_ac_no+") and device_id NOT IN ("+device_id+") and status = 1";  
                                }	
                             
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting2 : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                    if (typeof input.title == 'undefined' || input.title == "") {
                                        input.title = "New Post from Classgenie";
                                    }									
                                    _.each(rows, function (item) {
                                        if (config.env === 'production') {
                                            _global.pushNotification({module_id: 6, message: _global.cutString(input.title, 20) + '..', title: classNameRows[0]['class_name']+'-Assignment', device_id: item.device_id, member_no: parent_ac_no});
                                        }
                                    });
                                });
                               }

								 });

                                 if(_.size(student_ac) > 0){
                                //Update student notification status
                                QUERY = "SELECT student_info_id FROM " + config_constant.USERSTUDENTINFO + " WHERE student_ac_no IN (" + student_ac + ")";
                                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error in Selecting11 : %s", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    } else {
                                        var ids = [];
                                        _.each(rows, function (item) {
                                            ids += ',' + "'" + item.student_info_id + "'";
                                        });
                                        if (ids != '') {
                                            ids = ids.substring(1);
                                        }
                                        QUERY = "SELECT student_no FROM " + config_constant.STUDENTINFO + " WHERE id IN (" + ids + ") AND status = '1'";
                                        req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                                            if (err) {
                                                if (config.debug) {
                                                    req.app.get('global').fclog("Error in Selecting12 : %s", err);
                                                    res.json({error_code: 1, error_msg: message.technical_error});
                                                    return false;
                                                }
                                            }
                                            var student_no = [];
                                            _.each(rows1, function (item) {
                                                student_no += ',' + "'" + item.student_no + "'";
                                            });
                                            if (student_no != '') {
                                                student_no = student_no.substring(1);
                                            }
                                            QUERY = "UPDATE " + config_constant.STUDENTASSIGNMENT + " SET notification_status = '1' WHERE student_no IN (" + student_no + ") AND (assignment_id = '" + id + "')  ";
                                            req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                                if (err) {
                                                    if (config.debug) {
                                                        req.app.get('global').fclog("Error in Updating: %s", err);
                                                        res.json({error_code: 1, error_msg: message.technical_error});
                                                        return false;
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });
                            }                            
                        });
                       }
                    }
                });
            });
            output.status = message.success;
            output.comments = message.success;
            res.json(output);
        });
}
});
    },

    /**
     * Update assignment by teacher.
     *
     * @param req, res
     * @return response
     */
    assignmentDelete: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'schools/add/request_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.id != 'undefined') {
            SET += " id=?, ";
            data.push(input.id.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "DELETE FROM " + config_constant.ASSIGNMENT + " WHERE id = '" + input.id + "' ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Deleting: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "DELETE FROM " + config_constant.STUDENTASSIGNMENT + " WHERE assignment_id = '" + input.id + "' ";
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
    },

    /**
     * list of submited assignment.
     *
     * @param req, res
     * @return response
     */
    submitedList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/submitedlist_access');
        var data = [], output = {};
        var student_name = [], assignment_list = [];
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));	
		  var page_size = req.app.get('config').page_size;
          var start_record_index = (input.page_number - 1) *page_size;
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
          var sort_by = (typeof input.sort_by != 'undefined' && input.sort_by=='A' ? " asc ":" desc ");
        if (typeof input.assignment_id != 'undefined') {
            SET += " assignment_id=?, ";
            data.push(input.assignment_id.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE assignment_id = '" + input.assignment_id + "' ORDER BY status DESC "+limit+" ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Selecting: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                var assignment_id = [], student_no = [];
                output.assignmentStudentList = [];
                _.each(rows, function (item) {
                    output.assignmentStudentList.push(item);
                    assignment_id += ',' + "'" + item.assignment_id + "'";
                    student_no += ',' + "'" + item.student_no + "'";
                });
                if (assignment_id != '') {
                    assignment_id = assignment_id.substring(1);
                }
                if (student_no != '') {
                    student_no = student_no.substring(1);
                }
                QUERY = "SELECT * FROM " + config_constant.ASSIGNMENT + " WHERE id IN (" + assignment_id + ") ";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error in Selecting: %s", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    output.assignment_list = rows;
                });
                item_node = [];
                QUERY = "SELECT name, student_no, status as student_status FROM " + config_constant.STUDENTINFO + " WHERE student_no IN (" + student_no + ") ORDER BY name ASC";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    _.each(rows, function (item) {
                        item_node[item.student_no] = item;
                    });
                    _.each(output.assignmentStudentList, function (item, index) {
                        if (output.assignmentStudentList != 'undefined') {
                            output.assignmentStudentList[index]['student_name'] = item_node[item.student_no];
                        }
                    });
                    output.status = message.success;
                    output.comments = message.success;
                    res.json(output);
                });
            }
        });
    },

    /**
     *Class list base in student number.
     *
     * @param req, res
     * @return response
     */
    assignmentClassList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'teacher/search_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {};
        var where = " WHERE 1=1 ";        
        if (typeof query_str.parent_ac_no != 'undefined') {
            where += " AND parent_ac_no=? ";
            data.push(query_str.parent_ac_no.trim());
        }
        if (typeof query_str.name != 'undefined') {
            where += " AND name=? ";
            data.push(query_str.name.trim());
        }    
        QUERY = " SELECT class_id, name, student_no, parent_no FROM " + config_constant.STUDENTINFO + " WHERE parent_ac_no = '"+query_str.parent_ac_no+"' AND name = BINARY '"+query_str.name+"' ";
        req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting2 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            output.class_list =[];
           // var output.class_details = [];
            var class_id = [];
            _.each(rows1, function(item){
                output.class_list.push(item);
                class_id += ','+"'"+item.class_id+"'";
            });
            if(class_id != ''){
                class_id = class_id.substring(1);
            } 
            class_details = [];           
            QUERY = " SELECT * FROM " + config_constant.CLASSINFO + " WHERE class_id IN ("+class_id+") ";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
               _.each(rows1, function(item){
                class_details[item.class_id] = item;
               });
                _.each(output.class_list, function (item, index) {
                        if (output.class_list != 'undefined') {
                            output.class_list[index]['class_list'] = class_details[item.class_id];
                        }
                    });
                    output.timestamp = req.query.timestamp;
                    output.status = message.success;
                    output.comments = message.success;
                    mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'teacher/search_access');
                    res.json(output);               
            });           
        });   
    },

    /**
     * Parent assignment list.
     *
     * @param req, res
     * @return response
     */
    parentAssignmentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/submitedlist_access');
        var data = [], output = {}, class_name = [], name = [], teacher_name = [], teacher_ac_no = [], student_name = [], assignment_list = [];
        var search = '';
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        var page_size = req.app.get('config').page_size;
          var start_record_index = (input.page_number - 1) *page_size;
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
          var sort_by = (typeof input.sort_by != 'undefined' && input.sort_by=='A' ? " asc ":" desc ");
        if (typeof input.class_id != 'undefined') {
            SET += "class_id =?, ";
            data.push(input.class_id.trim());
        }
        if (typeof input.student_no != 'undefined') {
            SET += "student_no =?, ";
            data.push(input.student_no.trim());
        }
        if (input.fromDate != '' && input.toDate != '') {
            search = " submition_date>='" + input.fromDate + "' AND submition_date <= '" + input.toDate + "'";
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE (class_id = '" + input.class_id + "') AND (student_no = '" + input.student_no + "') "+limit+"  ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Selecting2: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            if (_.size(rows) > 0) {
                var id = [];
                _.each(rows, function (item) {
                    id += ',' + "'" + item.assignment_id + "'";
                });
                if (id != '') {
                    id = id.substring(1);
                }      
                // if (input.fromDate == '' || input.toDate == "") {
                //    QUERY ="SELECT a.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" s where s.submition_date >= curdate() and (class_id =  '" + input.class_id + "') AND (id IN (" + id + ")) ORDER BY s.`submition_date` asc) a UNION  SELECT b.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" t where t.`submition_date` < curdate() and (class_id =  '" + input.class_id + "') AND (id IN (" + id + "))  ORDER BY t.submition_date desc) b";
                // } else {
                //     QUERY ="SELECT a.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" s where s.submition_date >= curdate() and (class_id =  '" + input.class_id + "') AND (id IN (" + id + ")) AND (" + search + ") ORDER BY s.`submition_date` asc) a UNION  SELECT b.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" t where t.`submition_date` < curdate() and (class_id =  '" + input.class_id + "') AND (id IN (" + id + ")) AND (" + search + ") ORDER BY t.submition_date desc) b";
                // }
                QUERY1 = "SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date < curdate() and (class_id = '"+input.class_id+"') AND (id IN (" + id + ")) " + search + "  ORDER BY `submition_date` desc  ";
        
                req.app.get('connection').query(QUERY1, data, function (err, rows3, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting1 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    
                    QUERY2 ="SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%Y/%m/%d') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date >= curdate() and (class_id =  '" + input.class_id + "') AND (id IN (" + id + ")) " + search + " ORDER BY `submition_date` ASC  ";
                    
                    req.app.get('connection').query(QUERY2, data, function (err, rows4, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting1 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        } 
                    if(typeof rows4 != ''){
                      var rows = rows4.concat(rows3); 
                   }               
                
                    var assignment_list = [];
                    output.assignment_list = [];
                    _.each(rows, function (item) {
                        output.assignment_list.push(item);
                    });
                    var garde_details = {};
                    QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE (class_id = '" + input.class_id + "') AND (student_no = '" + input.student_no + "') ORDER BY id  ";
                    req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                        _.each(rows1, function (item) {
                            garde_details[item.assignment_id] = item;
                        });
                        _.each(output.assignment_list, function (item, index) {
                            if (typeof garde_details[item.id] != 'undefined') {
                                output.assignment_list[index]['grade_title'] = garde_details[item.id];
                            }
                        });
                        output.status = message.success;
                        output.comments = message.success;
                        res.json(output);
                        						
                    });
                });
              });

            } else {
                res.json({'status': message.failure, 'comments': message.failure});
                return false;
            }
        });
    },

    /**
     * Parent assignment list.
     *
     * @param req, res
     * @return response
     */
    studentAssignmentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(_.extend(req.body, req.query))}, 'student/assignment/list_access');
        var data = [], output = {}, class_name = [], name = [], item_details = {}, teacher_ac_no = [], teacher_name = [];
        var search = '';
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
         var page_size = req.app.get('config').page_size;
          var start_record_index = (input.page_number - 1) *page_size;
          var limit = (typeof start_record_index != 'undefined' && typeof page_size != 'undefined' && start_record_index > -1 && page_size != '') ? " LIMIT " + start_record_index + " ," + page_size : " LIMIT 0," + req.app.get('config').page_size;
          var sort_by = (typeof input.sort_by != 'undefined' && input.sort_by=='A' ? " asc ":" desc ");
        if (typeof input.class_id != 'undefined') {
            SET += " class_id =?, ";
            data.push(input.class_id.trim());
        }
        if (input.fromDate != '' && input.toDate != '') {
            search = " AND submition_date>='" + input.fromDate + "' AND submition_date <= '" + input.toDate + "'";
        }
		
        SET = SET.trim().substring(0, SET.trim().length - 1);
        // QUERY ="SELECT a.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" s where s.submition_date >= curdate() and class_id =  '" + input.class_id + "' " + search + " ORDER BY s.`submition_date` asc) a UNION  SELECT b.* FROM ( SELECT `id`, `title`,`description`,`attachment`,`class_id`,`member_no`,`status`,submition_date, created_at FROM "+config_constant.ASSIGNMENT+" t where t.`submition_date` < curdate() and class_id =  '" + input.class_id + "' " + search + " ORDER BY t.submition_date desc) b";
         QUERY1 = "SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%d/%m/%Y') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date < curdate() and class_id = '"+input.class_id+"'  " + search + "  ORDER BY `submition_date` desc "+limit+" ";
        
                req.app.get('connection').query(QUERY1, data, function (err, rows3, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting1 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    
                    QUERY2 ="SELECT `id`,`title`,`description`,`attachment`,`class_id`,`member_no`,`status`, DATE_FORMAT(submition_date,'%Y/%m/%d') AS submition_date, DATE_FORMAT(created_at,'%Y/%m/%d') AS created_at FROM "+config_constant.ASSIGNMENT+"  where submition_date >= curdate() and class_id =  '" + input.class_id + "' " + search + " ORDER BY `submition_date` ASC ";
                    
                    req.app.get('connection').query(QUERY2, data, function (err, rows4, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting1 : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        } 
                    if(typeof rows4 != ''){
                      var rows = rows4.concat(rows3); 
                   } 
        
            if (_.size(rows) > 0) {
                var member_no = [], assignment_id = [];
                var assignment_details = {};
                output.assignment_details = [];
                _.each(rows, function (item) {
                    output.assignment_details.push(item);
                    member_no += ',' + "'" + item.member_no + "'";
                    assignment_id += ',' + "'" + item.id + "'";
                });
                if (member_no != '') {
                    member_no = member_no.substring(1);
                }
                if (assignment_id != '') {
                    assignment_id = assignment_id.substring(1);
                }
               
                QUERY = "SELECT name FROM " + config_constant.EDUSER + " WHERE member_no IN (" + member_no + ")";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error in Selecting2: %s", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    output.teacher_name = rows;
                });
                var grade_details = {};
                QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE assignment_id IN (" + assignment_id + ") AND student_no = '"+input.student_no+"' AND (notification_status > '0') ";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    _.each(rows, function (item) {
                         if(typeof grade_details[item.assignment_id] == "undefined") {
                                  grade_details[item.assignment_id] = [];  
                               }
                              grade_details[item.assignment_id].push(item);                
                    });
                   _.each(output.assignment_details, function (item, index) {
                        if (output.assignment_details != 'undefined') {
                            output.assignment_details[index]['grade_details'] = grade_details[item.id];
                        }
                    });
                    output.status = message.success;
                    output.comments = message.success;
                    mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'student/assignment/list_access');
                    res.json(output);
                });
            } else {
                res.json({'status': message.failure, 'comments': message.nodata});
            }
        });
       });

    },

    /**
     * Assignment Submited.
     *
     * @param req, res
     * @return response
     */
    assignmentSubmit: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/submit_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.id != 'undefined') {
            SET += " id=?, ";
            data.push(input.id.trim());
        }
        if (typeof input.grade != 'undefined') {
            SET += " grade=?, ";
            data.push(input.grade.trim());
        }
        var curDate = _global.js_yyyy_mm_dd();
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
         if(err){
           if(config.debug){
                req.app.get('global').fclog("Error selecting1 : %s ",err);
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
        QUERY = "UPDATE " + config_constant.STUDENTASSIGNMENT + " SET grade = '" + input.grade + "', status = '1', notification_status = '1', submition_date='" + curDate + "' WHERE id = '" + input.id + "' ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Updating:%s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " WHERE student_no = '" + input.student_no + "' ";
                req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error in Selecting: %s", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id = '" + rows1[0]['id'] + "'";
                    req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error in Selecting: %s", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        } else if (_.size(rows2) <= 0) {
                            var flag_msg = "No data";
                            output.flag_msg = flag_msg;
                        } else {
                            // check length parent_ac_no  and student account number in Notification tabel
                            if (rows1[0]['parent_ac_no'] > 0 || rows2[0]['student_ac_no'] > 0) {
                                QUERY = "SELECT * FROM " + config_constant.NOTIFICATION + " where (member_no ='" + rows1[0]['parent_ac_no'] + "') OR (member_no ='" + rows2[0]['student_ac_no'] + "' ) and device_id NOT IN ("+device_id+") and status = 1";
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                    if (typeof input.description == 'undefined' || input.description == "") {
                                        input.description = "Student Assignment submited from Classgenie";
                                    }
                                    _.each(rows, function (item) {
                                        if (config.env === 'production') {
                                            _global.pushNotification({module_id: 1, message: _global.cutString(input.description, 20) + '..', title: 'Classgenie-Assignment', device_id: item.device_id, member_no: item.member_no});
                                        }
                                    });
                                });
                            }
                        }
                        QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE id='" + input.id + "' ";
                        req.app.get('connection').query(QUERY, data, function (err, rows4, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Selecting: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                output.user_list = rows4;
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'assignment/submit_access');
                                res.json(output);
                            }
                        });
                    });
                });
            }
        });
      }
    });
  },

    /**
     * Assignment reminder.
     *
     * @param req, res
     * @return response
     */
    assignmentReminder: function (req, res) {
       
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/submit_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.student_no != 'undefined') {
            SET += " student_no=?, ";
            data.push(input.student_no.trim());
        }
        
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
         if(err){
           if(config.debug){
                req.app.get('global').fclog("Error selecting1 : %s ",err);
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
        QUERY = "UPDATE " + config_constant.STUDENTASSIGNMENT + " SET status = '2' WHERE student_no = '" + input.student_no + "' AND id='" + input.id + "' and status='0'";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Updating: %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " WHERE student_no = '" + input.student_no + "' ";
                req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error in Selecting: %s", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id = '" + rows1[0]['id'] + "'";
                    req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {

                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error in Selecting: %s", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        } else if (_.size(rows2) <= 0) {
                            var flag_msg = "No data";
                            output.flag_msg = flag_msg;
                        } else {
                            // check length parent_ac_no  and student account number in Notification tabel
                            if (rows1[0]['parent_ac_no'] > 0 || rows2[0]['student_ac_no'] > 0) {
                                QUERY = "SELECT * FROM " + config_constant.NOTIFICATION + " where (member_no ='" + rows1[0]['parent_ac_no'] + "' ) OR (member_no ='" + rows2[0]['student_ac_no'] + "' ) and device_id NOT IN ("+device_id+") and status = 1 ";
                            
                                req.app.get('connection').query(QUERY, function (err, rows, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    }
                                    if (typeof input.description == 'undefined' || input.description == "") {
                                        input.description = "Reminder! from Classgenie Assignment not submitted by student.";
                                    }
                                    _.each(rows, function (item) {
                                        if (config.env === 'production') {
                                            _global.pushNotification({module_id: 1, message: _global.cutString(input.description, 20) + '..', title: 'Classgenie-Reminder', device_id: item.device_id, member_no: item.member_no});
                                        }
                                    });
                                });
                            }
                        }
                        QUERY = "SELECT * FROM " + config_constant.STUDENTASSIGNMENT + " WHERE student_no = '" + input.student_no + "' AND id='" + input.id + "' ";
                        req.app.get('connection').query(QUERY, data, function (err, rows4, fields) {

                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error in Selecting: %s", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                output.user_list = rows4;
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'assignment/submit_access');
                                res.json(output);
                            }
                        });
                    });
                });
            }
        });
      }
   });
 },

    /**
     * Student list reminder.
     *
     * @param req, res
     * @return response
     */
    studentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/studentlist_access');
        var data = [], output = {}, notification_status = [];
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.class_id != 'undefined') {
            SET += " class_id=?, ";
            data.push(input.class_id.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT image, name, student_no,status FROM " + config_constant.STUDENTINFO + " WHERE class_id = '" + input.class_id + "' ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Selecting : %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            output.details = [];
            student_no = [];
            _.each(rows, function (item) {
                output.details.push(item);
                student_no += ',' + "'" + item.student_no + "'";
            });
            if (student_no != '') {
                student_no = student_no.substring(1);
            }
            node_details = {};
            QUERY = "SELECT notification_status, student_no FROM " + config_constant.STUDENTASSIGNMENT + " WHERE student_no IN (" + student_no + ") ";
            req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                _.each(rows, function (item) {
                    node_details[item.student_no] = item.notification_status;
                });
                _.each(output.details, function (item, index) {
                    if (output.details != 'undefined') {
                        output.details[index]['notification_status'] = node_details[item.student_no];
                    }
                });
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'assignment/studentlist_access');
                res.json(output);
            });
        });
    },

    /**
     * Send notification.
     *
     * @param req, res
     * @return response
     */
    sendNotification: function (req, res) {
    	console.log(1);
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'assignment/sendnotification_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));

        var data = JSON.parse(Base64.decode(input['student_no']));
        var stu_data = [];
        _.each(data, function (item, index) {
            stu_data += ',' + "'" + item + "'";
        });
        if (stu_data != '') {
            stu_data = stu_data.substring(1);
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT device_id FROM "+config_constant.NOTIFICATION+" where member_no = "+input.sender_ac_no+"";
        req.app.get('connection').query(QUERY, data, function(err, rows_device_id, fields){
         if(err){
           if(config.debug){
                req.app.get('global').fclog("Error selecting1 : %s ",err);
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
        QUERY = "SELECT parent_ac_no, id FROM " + config_constant.STUDENTINFO + " WHERE student_no IN (" + stu_data + ") ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error in Selecting : %s", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var id = [];
            _.each(rows, function (item) {
                id += ',' + "'" + item.id + "'";
            });
            if (id != '') {
                id = id.substring(1);
            }
            QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + id + ") ";
            req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error in Selecting : %s", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                
                if (rows[0]['parent_ac_no'] > 0 || rows1[0]['student_ac_no'] > 0) {
                    QUERY = "SELECT * FROM " + config_constant.NOTIFICATION + " where (member_no ='" + rows[0]['parent_ac_no'] + "') OR (member_no ='" + rows1[0]['student_ac_no'] + "' ) and device_id NOT IN ("+device_id+") and status = 1";
                    req.app.get('connection').query(QUERY, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Selecting : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                       if (typeof input.message == 'undefined' || input.message == "") {
                            input.message = "New Assignment from Classgenie";
                       }else{
                          input.message = _global.cutString(input.message, 30)+'..';  
                       }
                       _.each(rows, function(item){
                       if (config.env === 'production'){
                              _global.pushNotification({module_id:1, message:input.message, title:'Classgenie-Post', device_id:item.device_id});
                       }
                   });
                    });
                }
                QUERY = "UPDATE " + config_constant.STUDENTASSIGNMENT + " SET notification_status = '1' WHERE student_no IN (" + stu_data + ") And assignment_id = '" + input.assignment_id + "'";
                console.log(QUERY);
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                });
                output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'assignment/sendnotification_access');
                res.json(output);
            });
        });
        }
      });
    }
}