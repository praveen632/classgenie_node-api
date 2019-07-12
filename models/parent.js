var _ = require('underscore');
var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/' + (config.env == 'development' ? 'message' : 'message.min') + '.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5');
var _global = require('../common/global');
var sendmail = require('../common/sendmail');
var encryption = require('../common/encryption');


var validator = require("email-validator");
var fs = require('fs');
module.exports = {
    /**
     * Display listing of resources.
     *
     * @param req, res
     * @return response
     */
    parentList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'parent_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {};
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index > -1 && query_str.page_size != '') ? " LIMIT " + query_str.start_record_index + " ," + query_str.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by == 'A' ? " asc " : " desc ");
        if (typeof query_str.id != 'undefined') {
            where += " AND id=? ";
            data.push(query_str.id.trim());
        }
        if (typeof query_str.name != 'undefined') {
            where += " AND name=? ";
            data.push(query_str.name.trim());
        }
        if (typeof query_str.email != 'undefined') {
            where += " AND email=? ";
            data.push(query_str.email.trim());
        }
        if (typeof query_str.phone != 'undefined') {
            where += " AND phone=? ";
            data.push(query_str.phone.trim());
        }
        if (typeof query_str.email_not_in != 'undefined') {
            where += " AND email<>? ";
            data.push(query_str.email_not_in.trim());
        }
        QUERY = "SELECT * FROM " + config_constant.EDUSER + " " + where + "  AND `type` ='3' and status > '-1' ORDER BY id " + sort_by + " " + limit + " ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            output.timestamp = req.query.timestamp;
            output.status = message.success;
            output.comments = message.success;
            output.user_list = rows;
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'parent_access');
            res.json(output);
        });
    },
    /**
     * Searching of resources.
     *
     * @param req, res
     * @return response
     */
    searchParent: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'parent/search_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {};
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index > -1 && query_str.page_size != '') ? " LIMIT " + query_str.start_record_index + " ," + query_str.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by == 'A' ? " asc " : " desc ");
        if (typeof query_str.member_no != 'undefined') {
            where += " AND member_no like ? ";
            data.push(query_str.member_no.trim() + "%");
        }
        if (typeof query_str.name != 'undefined') {
            where += " AND name like ? ";
            data.push(query_str.name.trim() + "%");
        }
        if (typeof query_str.email != 'undefined') {
            where += " AND email like ? ";
            data.push(query_str.email.trim() + "%");
        }
        QUERY = "SELECT * FROM " + config_constant.EDUSER + " " + where + " and status > '-1' ORDER BY id " + sort_by + " " + limit + " ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            output.timestamp = req.query.timestamp;
            output.status = message.success;
            output.comments = message.success;
            output.user_list = rows;
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'parent/search_access');
            res.json(output);
        });
    },
    /**
     * Searching of resources.
     *
     * @param req, res
     * @return response
     */
    addParent: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'parent_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.name != 'undefined') {
            SET += " name=?, ";
            data.push(input.name.trim());
        }
        if (typeof input.email != 'undefined') {
            SET += " email=?, ";
            data.push(input.email.trim());
        }
        if (typeof input.password != 'undefined') {
            SET += " password=?, ";
            data.push(md5(input.password.trim()));
        }
        if (typeof input.phone != 'undefined') {
            SET += " phone=?, ";
            data.push(input.phone.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT email FROM " + config_constant.EDUSER + " WHERE email=? and status > '-1'";
        req.app.get('connection').query(QUERY, [input.email], function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else if (_.size(rows) > 0) {
                res.json({'status': message.failure, 'comments': message.email_aready_exist});
                return false;
            } else {
                SELECT = "SELECT member_no FROM " + config_constant.PARENTSEED + " where user_id ='' ORDER BY id ASC limit 1";
                req.app.get('connection').query(SELECT, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Selecting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        result = rows[0];
                        QUERY = "INSERT INTO " + config_constant.EDUSER + " SET " + SET + ", member_no=" + result['member_no'] + ", type='3', created_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' " + ", updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " '";
                        req.app.get('connection').query(QUERY, data, function (err, rows, result) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error Inserting : %s ", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                SELECT = "SELECT * FROM " + config_constant.EDUSER + " where id ='" + rows.insertId + "' and status > '-1' ";
                                req.app.get('connection').query(SELECT, data, function (err, rows, result) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    } else {
                                        result = rows[0];
                                        QUERY = "UPDATE " + config_constant.PARENTSEED + "  SET user_id ='" + result['id'] + "', updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE member_no='" + result['member_no'] + "'";
                                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                            if (err) {
                                                if (config.debug) {
                                                    req.app.get('global').fclog("Error Updating : %s ", err);
                                                    res.json({error_code: 1, error_msg: message.technical_error});
                                                    return false;
                                                }
                                            }
                                        });
                                        sendmail.send({id: 15, 'to': input.email, 'member_no': result['member_no'], 'name': input.name, 'PROD_MAIL_USER': config_constant.PROD_MAIL_USER});
                                        output.timestamp = req.query.timestamp;
                                        output.status = message.success;
                                        output.comments = message.success;
                                        output.user_list = rows;
                                        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'parent_access');
                                        res.json(output);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    /**
     * Update parent
     *
     * @param req, res
     * @return response
     */
    updateParent: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'parent/update_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.name != 'undefined') {
            SET += " name=?, ";
            data.push(input.name.trim());
        }
        if (typeof input.email != 'undefined') {
            SET += " email=?, ";
            data.push(input.email.trim());
        }
        if (typeof input.member_no != 'undefined') {
            var img_name = 'img_' + input.member_no;
        }
        if (typeof input.image != 'undefined') {
            var img = input.image;
            var dataImage = img.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFile(config.upload_path+'/profile_image/' + img_name + '.jpg', dataImage, {encoding: 'base64'}, function (err) {
            });
            SET += " image=?, ";
            data.push(img_name + '.jpg');
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT * FROM " + config_constant.EDUSER + " WHERE member_no=? and status > '-1' ";
        req.app.get('connection').query(QUERY, input.member_no, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else {
                QUERY = "UPDATE " + config_constant.EDUSER + "  SET " + SET + ", updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE member_no='" + input.member_no + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Updating : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        QUERY = "SELECT * FROM " + config_constant.EDUSER + " WHERE member_no='" + input.member_no + "' and status > '-1' ";
                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
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
                                output.user_list = rows;
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'PUT', text: serialize.serialize(output)}, 'parent/update_access');
                                res.json(output);
                            }
                        });
                    }
                });
            }
        });
    },
    /**
     * Delete parent
     *
     * @param req, res
     * @return response
     */
    deleteParent: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'parent/delete_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.member_no != 'undefined') {
            SET += " member_no=?, ";
            data.push(input.member_no.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "UPDATE " + config_constant.EDUSER + " SET status = '-1', updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE member_no='" + input.member_no + "'";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Updating : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            QUERY = "UPDATE " + config_constant.STUDENTINFO + " SET parent_ac_no='0', request_status='0', updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE parent_ac_no='" + input.member_no + "'";
            req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                if (err) {
                    if (config.debug) {
                        req.app.get('global').fclog("Error Updating : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                QUERY = "DELETE FROM " + config_constant.EDPARENTUSER + " WHERE parent_ac_no ='" + input.member_no + "' ";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Deleting : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    }
                    QUERY = "DELETE FROM " + config_constant.NOTIFICATION + " WHERE member_no = '" + input.member_no + "' ";
                    req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                        if (err) {
                            if (config.debug) {
                                req.app.get('global').fclog("Error Deleting : %s ", err);
                                res.json({error_code: 1, error_msg: message.technical_error});
                                return false;
                            }
                        }
                        output.timestamp = req.query.timestamp;
                        output.status = message.success;
                        output.comments = message.success;
                        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'parent/delete_access');
                        res.json(output);
                    });
                });
            });
        });
    },
    /**
     * check parent code
     *
     * @param req, res
     * @return response
     */
    checkparentcode: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(_.extend(req.body, req.query))}, 'parentcode_access');
        var data = [], output = {};
        var SET = "";
        var input = JSON.parse(JSON.stringify(req.body));
        if (typeof input.parent_no != 'undefined') {
            SET += " parent_no=?, ";
            data.push(input.parent_no.trim());
        }
        if (typeof input.parent_ac_no != 'undefined') {
            SET += " parent_ac_no=?, ";
            data.push(input.parent_ac_no.trim());
        }
        SET = SET.trim().substring(0, SET.trim().length - 1);
        QUERY = "SELECT * FROM " + config_constant.STUDENTINFO + " WHERE parent_no='" + input.parent_no + "' AND parent_ac_no = '0' ";
        req.app.get('connection').query(QUERY, data, function (err, rows2, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else if(_.size(rows2) > 0)
            {
                QUERY = "UPDATE " + config_constant.STUDENTINFO + " SET parent_ac_no='" + input.parent_ac_no + "', request_status='1', updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE parent_no='" + input.parent_no + "'";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if(err) {
                        if(config.debug) {
                            req.app.get('global').fclog("Error Updating : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        QUERY = "SELECT * FROM " + config_constant.STUDENTINFO + " WHERE parent_ac_no = '" + input.parent_ac_no + "'";
                        req.app.get('connection').query(QUERY, data, function (err, rows1, fields) {
                            if (err) {
                                if (config.debug) {
                                    req.app.get('global').fclog("Error Selecting : %s ", err);
                                    res.json({error_code: 1, error_msg: message.technical_error});
                                    return false;
                                }
                            } else {
                                QUERY = "SELECT student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id = " + rows2[0]['id'] + " ";
                                req.app.get('connection').query(QUERY, data, function (err, rows3, fields) {
                                    if (err) {
                                        if (config.debug) {
                                            req.app.get('global').fclog("Error Selecting : %s ", err);
                                            res.json({error_code: 1, error_msg: message.technical_error});
                                            return false;
                                        }
                                    } else if (_.size(rows3) > 0) {
                                        QUERY = "SELECT student_ac_no FROM " + config_constant.EDPARENTUSER + " WHERE student_ac_no = " + rows3[0]['student_ac_no'] + " OR parent_ac_no = " + input.parent_ac_no + " ";
                                        req.app.get('connection').query(QUERY, data, function (err, rows4, fields) {
                                            if (err) {
                                                if (config.debug) {
                                                    req.app.get('global').fclog("Error Selecting : %s ", err);
                                                    res.json({error_code: 1, error_msg: message.technical_error});
                                                    return false;
                                                }
                                            } else if (_.size(rows4) > 0) {
                                                output.comments = message.success;
                                            } else {
                                                QUERY = "INSERT INTO " + config_constant.EDPARENTUSER + " SET parent_ac_no = " + input.parent_ac_no + ", student_ac_no = " + rows3[0]['student_ac_no'] + ", created_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' " + ", updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' ";
                                                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                                                    if (err) {
                                                        if (config.debug) {
                                                            req.app.get('global').fclog("Error Inserting3 : %s ", err);
                                                            res.json({error_code: 1, error_msg: message.technical_error});
                                                            return false;
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        output.comments = message.success;
                                    }
                                });
                                output.timestamp = req.query.timestamp;
                                output.status = message.success;
                                output.comments = message.success;
                                output.student_list = rows1;
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(output)}, 'parentcode_access');
                                res.json(output);
                            }
                        });
                    }
                });
            } else {
                res.json({'status': message.failure, 'comments': message.parentcode});
            }
        });
    },

    /**
     * Display listing of parent kids.
     *
     * @param req, res
     * @return response
     */
    KidsList: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'parent/kidslist_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {}, class_id = [], class_name = [];
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index > -1 && query_str.page_size != '') ? " LIMIT " + query_str.start_record_index + " ," + query_str.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by == 'A' ? " asc " : " desc ");
        if (typeof query_str.parent_ac_no != 'undefined') {
            where += " AND parent_ac_no=? ";
            data.push(query_str.parent_ac_no.trim());
        }
        //QUERY = "SELECT id, name, image, class_id, parent_ac_no, student_no FROM " + config_constant.STUDENTINFO + " WHERE parent_ac_no = '"+query_str.parent_ac_no+"' AND status = '1' ORDER BY parent_ac_no " + sort_by + " " + limit + " ";
		QUERY = "SELECT id, name, image, class_id, parent_ac_no, student_no FROM " + config_constant.STUDENTINFO + " WHERE parent_ac_no = '"+query_str.parent_ac_no+"' ORDER BY parent_ac_no " + sort_by + "";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            var id =[];
            output.student_list = [];
            _.each(rows, function (item) {
                output.student_list.push(item);
                if (class_id != '0') {
                    class_id += ',' + "'" + item.class_id + "'";
                    id += ','+"'"+item.id+"'";
                }
            });
            if (class_id != '') {
                class_id = class_id.substring(1);
            }
            if (id != '') {
                id = id.substring(1);
            }
            item_member = {};
            QUERY = "SELECT student_info_id, student_ac_no FROM " + config_constant.USERSTUDENTINFO + " WHERE student_info_id IN (" + id + ")";
            req.app.get('connection').query(QUERY, function (err, rows, fields) {
                _.each(rows, function (item, index) {
                    item_member[item.student_info_id] = item.student_ac_no;
            });
            var item_node = {};
            QUERY = "SELECT class_name,class_id FROM " + config_constant.CLASSINFO + " WHERE class_id IN (" + class_id + ")";
            req.app.get('connection').query(QUERY, function (err, rows, fields) {
                _.each(rows, function (item, index) {
                    item_node[item.class_id] = item.class_name;
                });
                _.each(output.student_list, function (item, index) {                 
                        output.student_list[index]['class_name'] = item_node[item.class_id];
                        output.student_list[index]['member_no'] = item_member[item.id];                  
                });
                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(output)}, 'parent/kidslist_access');
                res.json(output);
            });
        });
        });
    },
    /**
     * Remove kids.
     *
     * @param req, res
     * @return response
     */
    kidRemove: function (req, res) {
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'POST', text: serialize.serialize(req.query)}, 'parent/kidremove_access');
        var input = JSON.parse(JSON.stringify(req.body));
        var data = [], output = {};
        var where = " WHERE 1=1 ";
        var limit = (typeof input.start_record_index != 'undefined' && typeof input.page_size != 'undefined' && input.start_record_index > -1 && input.page_size != '') ? " LIMIT " + input.start_record_index + " ," + input.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof input.sort_by != 'undefined' && input.sort_by == 'A' ? " asc " : " desc ");
        if (typeof input.student_no != 'undefined') {
            where += " AND student_no=? ";
            data.push(input.student_no.trim());
        }
        QUERY = "SELECT * FROM " + config_constant.STUDENTINFO + " " + where + " ";
        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
            if (err) {
                if (config.debug) {
                    req.app.get('global').fclog("Error Selecting : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            } else if (_.size(rows) > 0) {
                QUERY = "UPDATE " + config_constant.STUDENTINFO + " SET parent_ac_no = '0', request_status = '0', updated_at=" + " ' " + _global.js_yyyy_mm_dd_hh_mm_ss() + " ' WHERE student_no = '" + input.student_no + "' ";
                req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
                    if (err) {
                        if (config.debug) {
                            req.app.get('global').fclog("Error Updating : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                    } else {
                        QUERY = "SELECT * FROM " + config_constant.STUDENTINFO + " " + where + " ";
                        req.app.get('connection').query(QUERY, data, function (err, rows, fields) {
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
                                output.user_list = rows;
                                mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'DELETE', text: serialize.serialize(output)}, 'parent/kidremove_access');
                                res.json(output);
                            }
                        });
                    }
                });
            } else {
                res.json({'status': message.failure, 'comments': message.noresult});
            }
        });
    },
    /**
     * All school list kids.
     *
     * @param req, res
     * @return response
     */
    totalSchools: function(req, res){
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'parent/schoollist_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {};
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index > -1 && query_str.page_size != '') ? " LIMIT " + query_str.start_record_index + " ," + query_str.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by == 'A' ? " asc " : " desc ");
        if (typeof query_str.parent_ac_no != 'undefined') {
            where += " AND parent_ac_no=? ";
            data.push(query_str.parent_ac_no.trim());
        }
        QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+query_str.parent_ac_no+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
                if(config.debug){
                     req.app.get('global').fclog("Error Selecting : %s ", err);
                     res.json({error_code: 1, error_msg: message.technical_error});
                     return false;
                }
            }
            class_id =[];
            _.each(rows, function(item){
              class_id += ','+"'"+item.class_id+"'";
            });
            if(class_id != ''){
                class_id = class_id.substring(1);
            }
            QUERY = "SELECT DISTINCT school_id FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") ";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                 if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                 }
                 school_id =[];
                 _.each(rows, function(item){
                     school_id +=','+"'"+item.school_id+"'";
                 });
                 if(school_id != ''){
                    school_id = school_id.substring(1);
                 }
                 QUERY = "SELECT school_name, school_id FROM "+config_constant.SCHOOLS+" WHERE school_id IN ("+school_id+") and status >= '0' and status != '2' ";
                 req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                     if(err){
                        if(config.debug){
                            req.app.get('global').fclog("Error Selecting1 : %s ", err);
                            res.json({error_code: 1, error_msg: message.technical_error});
                            return false;
                        }
                     }
                     output.timestamp = req.query.timestamp;
                     output.status = message.success;
                     output.comments = message.success;
                     output.user_list = rows;
                     mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'DELETE', text: serialize.serialize(output)}, 'parent/schoollist_access');
                     res.json(output);  
                 });
            });
        });
    },

    /**
     * class list by school id.
     *
     * @param req, res
     * @return response
     */
    classList: function(req, res){
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'GET', text: serialize.serialize(req.query)}, 'parent/classlist_access');
        var query_str = url.parse(req.url, true).query;
        var data = [], output = {};
        var where = " WHERE 1=1 ";
        var limit = (typeof query_str.start_record_index != 'undefined' && typeof query_str.page_size != 'undefined' && query_str.start_record_index > -1 && query_str.page_size != '') ? " LIMIT " + query_str.start_record_index + " ," + query_str.page_size : " LIMIT 0," + req.app.get('config').page_size;
        var sort_by = (typeof query_str.sort_by != 'undefined' && query_str.sort_by == 'A' ? " asc " : " desc ");
        if (typeof query_str.school_id != 'undefined') {
            where += " AND school_id=? ";
            data.push(query_str.school_id.trim());
        }
        if (typeof query_str.parent_ac_no != 'undefined') {
            where += " AND parent_ac_no=? ";
            data.push(query_str.parent_ac_no.trim());
        }       
        QUERY = "SELECT class_id FROM "+config_constant.STUDENTINFO+" WHERE parent_ac_no = '"+query_str.parent_ac_no+"' ";
        req.app.get('connection').query(QUERY, data, function(err, rows, fields){
            if(err){
                if(config.debug){
                    req.app.get('global').fclog("Error Selecting1 : %s ", err);
                    res.json({error_code: 1, error_msg: message.technical_error});
                    return false;
                }
            }
            class_id = [];
            _.each(rows, function(item){
                 class_id +=','+"'"+item.class_id+"'"; 
            });
            if(class_id != ''){
                class_id = class_id.substring(1);
            }
            QUERY = "SELECT class_id, class_name FROM "+config_constant.CLASSINFO+" WHERE class_id IN ("+class_id+") AND school_id = '"+query_str.school_id+"' ";
            req.app.get('connection').query(QUERY, data, function(err, rows, fields){
                if(err){
                    if(config.debug){
                        req.app.get('global').fclog("Error Selecting1 : %s ", err);
                        res.json({error_code: 1, error_msg: message.technical_error});
                        return false;
                    }
                }
                 output.timestamp = req.query.timestamp;
                 output.status = message.success;
                 output.comments = message.success;
                 output.user_list = rows;
                 mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: 'DELETE', text: serialize.serialize(output)}, 'parent/classlist_access');
                 res.json(output); 
            });
        });

    },
	
	/**
     * parent_student message
     *
     * @param req, res
     * @return response
     */
	
	 message: function (req, res){
         mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, '/parent/message');
         var output = {};
	     var query_str = url.parse(req.url, true).query;
		
	if(typeof query_str.token_parent != 'undefined'){
		 var token = query_str.token_parent; 
         var parent_token = encryption.decrypt(token);
		 var parent_arr = parent_token.split("~");
		
		 
		// Parent varified by teacher
		 QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE email='"+parent_arr[0]+"' AND type = '3' AND status > '-1'";
		
		 
		 req.app.get('connection').query(QUERY, [token], function(err, rows_eduser, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	            }
		
		
		 if(_.size(rows_eduser) > 0){
			 
			 
		 QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE parent_no=?";
		 
		 req.app.get('connection').query(QUERY, [parent_arr[1]], function(err, rows, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	            }
				
							
	            if(rows[0].parent_ac_no == 0 && rows[0].parent_ac_no != 'undefined'){ 
                         // change messege"plz signin and add parent code" 	            	     
						 //var msg = message.signup_parentcode;
						
					      
                   	 }else{
 	            	// update request_status   
				
	            	 QUERY = "UPDATE "+config_constant.STUDENTINFO+" SET request_status='1' WHERE parent_ac_no=?";	
			 
                     req.app.get('connection').query(QUERY, [parent_arr[1]], function(err, rows1, fields){
			           if(err){
			              req.app.get('global').fclog("Error Updating : %s ",err);
			              res.end();
			             }
			             var msg = message.already_Activated;
				output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
			          
			             
			         });
					 
					 QUERY = "UPDATE "+config_constant.EDUSER+" SET status='1' WHERE email=? AND type = '3'";	            	 
                     req.app.get('connection').query(QUERY, [parent_arr[1]], function(err, rows1, fields){
			           if(err){
			              req.app.get('global').fclog("Error Updating : %s ",err);
			              res.end();
			             }
			          });
			   }
           });
		   }else{
		      var msg = message.signup;
		       	output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
		    }
		   });
		}
		
		
		
		else if(typeof query_str.token_student != 'undefined')
            {
		      var token = query_str.token_student; 
              var token_no = encryption.decrypt(token);
		      var arr = token_no.split("~"); 
			  
			  

		      QUERY = "SELECT * FROM "+config_constant.EDUSER+" WHERE email='"+arr[0]+"' AND type = '3' AND status > '-1'";
		      req.app.get('connection').query(QUERY, function(err, rows, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting1 : %s ",err);
	              res.end();
	            } 
				
	            if(_.size(rows)>0){
				  var parent_ac_no = rows[0].member_no;
                  QUERY = "SELECT * FROM "+config_constant.STUDENTINFO+" WHERE student_no=?";
                 
  		          req.app.get('connection').query(QUERY, [arr[1]], function(err, rowsinfo, fields){
		           if(err){
		              req.app.get('global').fclog("Error Selecting2 : %s ",err);
		              res.end();
		            }
					
					
					if(rowsinfo[0].parent_ac_no==0){
					UPDATE = "UPDATE "+config_constant.STUDENTINFO+" SET parent_ac_no=?, status='1', request_status = '1'  where student_no=?";
					   req.app.get('connection').query(UPDATE, [parent_ac_no,arr[1]], function(err, rows1, fields){
					   if(err){
						  req.app.get('global').fclog("Error Selecting3 : %s ",err);
						return false;
						 }
	                   });
                    UPDATE = "UPDATE "+config_constant.EDUSER+" SET status='1' where member_no=?";
					   req.app.get('connection').query(UPDATE, [parent_ac_no], function(err, rows1, fields){
					   if(err){
						  req.app.get('global').fclog("Error Selecting : %s ",err);
						  return false;
						 }
	                   }); 
		 
					}
				  QUERY = "SELECT * FROM "+config_constant.USERSTUDENTINFO+" WHERE student_info_id=?";

		          req.app.get('connection').query(QUERY, [rowsinfo[0].id], function(err, row_eduserstudentinfo, fields){                  
		           if(err){
		              req.app.get('global').fclog("Error Selecting4 : %s ",err);
		              return false;
		            }
                  QUERY = "SELECT * FROM "+config_constant.EDPARENTUSER+" WHERE student_ac_no=? and parent_ac_no=?";
                  
				  req.app.get('connection').query(QUERY, [row_eduserstudentinfo[0].student_ac_no, parent_ac_no], function(err, row_edparentuser, fields){ 
				 
		           if(_.size(row_edparentuser) >0){
					UPDATE = "UPDATE "+config_constant.EDUSER+" SET status='1' where member_no=?";
					req.app.get('connection').query(UPDATE, [row_eduserstudentinfo[0].student_ac_no], function(err, rows1, fields){
					 
					 
					 
					   if(err){
						  req.app.get('global').fclog("Error Selecting : %s ",err);
						  return false;
						 }
	                   });
                     var msg = message.already_Activated;
					 
					  
			    output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
			
					 
					 
			        
                   }else{
	               UPDATE = "UPDATE "+config_constant.EDUSER+" SET status='1' where member_no=?";
				   
					req.app.get('connection').query(UPDATE, [row_eduserstudentinfo[0].student_ac_no], function(err, rows1, fields){
					   if(err){
						  req.app.get('global').fclog("Error Selecting : %s ",err);
						  return false;
						 }
	                   }); 
                             
							
                  INSERT = "INSERT INTO "+config_constant.EDPARENTUSER+" SET parent_ac_no=?, student_ac_no=?, created_at=" +" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' " +", updated_at="+" ' "+_global.js_yyyy_mm_dd_hh_mm_ss()+" ' ";     		 
                   req.app.get('connection').query(INSERT, [parent_ac_no,row_eduserstudentinfo[0].student_ac_no], function(err, rows, fields){
                     req.app.get('global').fclog("Error Selecting11 : %s ",err);
	                 res.end();
                   });
				   
				   
                 var msg = message.ac_activate_Kids;
				output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
				 
			     
			    }                 
                });
		     });
			 });
	            }else{
	            var msg = message.signup;
			    output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
	            }
	           });
            }
			
			
			
			else if(typeof query_str.member_no != 'undefined'){
           
			// teacher varified by email link by teacher or Admin 	
             var member_no = query_str.member_no;
		     var token = encryption.decrypt(member_no);
             QUERY = "SELECT email, school_id, name FROM "+config_constant.EDUSER+" WHERE member_no=? and type != '3' and type != '4' and status='0'";
		     req.app.get('connection').query(QUERY, [token], function(err, rows, fields){
	           
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	            }else if(_.size(rows) > 0) {	
            	
             // Update ed_user table	
	          UPDATE = "UPDATE "+config_constant.EDUSER+" SET status='1' where member_no=?";
	          req.app.get('connection').query(UPDATE, [token], function(err, rows1, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	             }
	            });
	          
	          // update ed_school_techer_request table
	           UPDATE = "UPDATE "+config_constant.SCHOOLTEACHER_REQ+" SET status='1' where teacher_ac_no=?";
	           req.app.get('connection').query(UPDATE, [token], function(err, rows1, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	             }
	            }); 
              
               // update ed_classinfo table
               UPDATE = "UPDATE "+config_constant.CLASSINFO+" SET school_id=? where teacher_ac_no=?";
	           req.app.get('connection').query(UPDATE, [rows[0].school_id,token], function(err, rows1, fields){
	           if(err){
	              req.app.get('global').fclog("Error Selecting : %s ",err);
	              res.end();
	             }
	           }); 
               
               //call api for send mail by portal 
               module.exports.sendMail(rows[0].email, '7');
	         
               var msg = message.teacher_schools_activate;
               module.exports.sendMsg(req, res, obj, msg, rows);
               }else{
               var msg = message.already_Activated;
               module.exports.sendMsg(req, res, obj, msg, rows);
		        }
				
				output.timestamp = req.query.timestamp;
                output.status = message.success;
                output.comments = message.success;
				output.message = msg;
                output.user_list = rows;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, '/parent/message');
                res.json(output);
				
		     
          });
         }
	},
   
   sendMsg: function(req, res, obj, msg, rows){
   	       var sess =   req.session;
	      res.render(obj.render_page,{
	           	  'render_page': obj.render_page,
	           	  'env':obj.env,
			   	  'title': (_.size(rows)>0 ? "Status" : ""),
			   	  'menu': menu.english,
			   	  'message': msg,
			   	  'meta_keyword': (_.size(rows)>0 ? rows[0].metakey : ""),
		  	      'meta_desc': (_.size(rows)>0 ? rows[0].metadesc : "")
		   	       });
	},

	sendMail: function(email, id, req){
		
		request(mailUrl.mail_url+'?email='+email+'&id='+id+'&token=aforetechnical@321!', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			     // Show the HTML for the Google homepage.
			  }
			})
		
	}
	
	
	
}

