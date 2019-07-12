//Load all the routes
var _ = require('underscore');

var serialize = require('node-serialize');
var multer = require('multer');
var _global = require('./common/global');
var mongo_connection = require('./common/mongo_connection');
var users = require('./routes/users');
var teacher = require('./routes/teacher');

var student = require('./routes/student');
var classinfo = require('./routes/classinfo');
var parent = require('./routes/parent');
var login = require('./routes/login');
var change_password = require('./routes/change_password');
var add_student = require('./routes/add_student');
var customizeSkills = require('./routes/customizeSkills');
var groupinfo = require('./routes/groupinfo');
var sendmail = require('./routes/sendmail');
var pointSystem = require('./routes/pointSystem');
var pdfgenerate = require('./routes/pdfgenerate');
var chat_teacher = require('./routes/chat_teacher');
var checkstatus = require('./routes/checkStatus');
var resetBubbles = require('./routes/resetBubbles');
var awardmultiple = require('./routes/awardmultiple');
var connectparent = require('./routes/connectparent');
var classlist = require('./routes/classlist');
var classStories = require('./routes/classStories');
var studentclassStories = require('./routes/studentclassStories');
var studentListMsg = require('./routes/studentListMsg');
var teacherlist = require('./routes/teacherlistchat');
var schools = require('./routes/schools');
var attendance = require('./routes/attendance');
var upload_data = require('./routes/upload_data');
var report = require('./routes/report');
var forgetpassword = require('./routes/forgetPassword');
var referteacher = require('./routes/referTeacher');
var upload = multer({dest: 'assets/tmp/'});
var download_exl = require('./routes/download_exl');
var schoolStory = require('./routes/schoolStory');
var notification = require('./routes/notification');
var save_deviceid = require('./routes/save_deviceid');
var student_story = require('./routes/student_story');
var assignment = require('./routes/assignment');
var attendance_report = require('./routes/attendance_report');
var api_token = require('./routes/api_token');
var class_perform = require('./routes/class_perform');
var class_name = require('./routes/class_name');
var event_responsibilty = require('./routes/event_responsibilty');
var classgenie_event = require('./routes/events');
var chats = require('./routes/chats')
useApp = function (app) {
    app.use(function (req, res, next) {console.log(req);
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        req.query.timestamp = _global.getTimeStamp();
        var text = req.query;
        if (_.size(req.body) > 0) {
            text = _.extend(req.body, req.query);
        }
        mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: '', text: serialize.serialize(text)}, 'access');
        var query = require('url').parse(req.url, true).query;
        var body = JSON.parse(JSON.stringify(req.body));  
         if(typeof body.token != 'undefined'){
            query.token = body.token;
        }
      if (query.token != app.get('config').token && req.originalUrl.indexOf('return_token') < 0) {
            mongo_connection.save({request_ip: req.ip, request_url: req.originalUrl, request_method: '', text: serialize.serialize({"error_code": 401, "error_msg": "unauthorized", timestamp: _global.getTimeStamp})}, 'access');
            res.json({"error_code": 401, "error_msg": "unauthorized"});
            return this;
        }
        delete req.query.token;
        if (_.size(req.body) > 0) {
            delete req.body.token;
        }
        next();
    });

    app.get('/pdfgenerate', pdfgenerate.pdf);

    //User module
    app.get('/user', users.list);
    app.get('/user/search', users.search);
    app.post('/user/', users.save);
    app.put('/update/user', users.save_edit);
    app.delete('/user', users.delete);

    //Teacher module
    app.get('/teacher', teacher.list);
    app.get('/teacher/search', teacher.search);
    app.post('/teacher', teacher.save);
    app.post('/teacher/update', upload.single('upload_file'), teacher.update);
    app.post('/teacher/delete', teacher.delete);
	app.get('/teacher/status', teacher.portal_change_status);
	app.get('/teacher/databyid_portal', teacher.getPortalDataById);
	app.post('/teacher/updateportalTeacherById', teacher.updateportalTeacherById);
	app.post('/teacher/remove_teacher_portal', teacher.remove_teacher_portal);
	
	
	
	

    //Student module
    app.get('/student', student.list);
    app.get('/student/search', student.search);
    app.post('/student', student.save);
    app.post('/student/update', student.update);
    app.post('/student/delete', student.delete);
    app.get('/student/add', student.saveAdd);
    app.get('/student/addstudentcode', student.addStudentCode);
    app.get('/student/studentlist', student.studentList);
    app.get('/student/disconnect', student.studentDisconnect);
    app.post('/student/updateimage', upload.single('upload_file'), student.updateImage);
    app.get('/student/classlist', student.StudentClassList);

    //Class module
    app.get('/classinfo', classinfo.list);
    app.get('/classinfo/search', classinfo.search);
    app.get('/classinfo/dashboard', classinfo.dashboard);
    app.get('/classinfo/studentlist', classinfo.studentlist);
    app.post('/classinfo', classinfo.save);
    app.post('/classinfo/update', classinfo.update);
    app.post('/classinfo/delete', classinfo.delete);
	app.get('/classinfo/studentlistPortal', classinfo.studentListPortal);
	app.post('/classinfo/studentcsvPortal',upload.single('upload_file'), classinfo.saveCsvFile);
	
	
	

    //Parent module
    app.get('/parent', parent.list);
    app.get('/parent/search', parent.search);
    app.post('/parent', parent.save);
    app.post('/parentcode', parent.checkcode);
    app.post('/parent/update', parent.update);
    app.post('/parent/delete', parent.delete);
    app.get('/parent/kidslist', parent.kidsList);
    app.post('/parent/kidremove', parent.kidRemove);
    app.get('/parent/schoollist', parent.totalSchools);
    app.get('/parent/classlist', parent.classList);
	app.get('/parent/message', parent.messageList);
	

    //CustomizeSkills module
    app.get('/editskills', customizeSkills.list);
    app.get('/editskills/imagelist', customizeSkills.imageList);
    app.post('/editskills', customizeSkills.save);
    app.post('/editskills/update', customizeSkills.update);
    app.post('/editskills/delete', customizeSkills.delete);

    //Login module
    app.get('/login', login.list);

    //Change Password Module
    app.post('/changepassword/update', change_password.save_edit);

    //Add Student module
    app.get('/addstudent', add_student.list_student);
    app.post('/addstudent/update', add_student.update_student);
    app.post('/addstudent/multiple', add_student.multiple_student);

    app.post('/addstudent/delete', add_student.delete_student);
    app.post('/addstudent', add_student.add_student);
    app.get('/addstudent/list', add_student.studentImageList);

    //Group Module
    app.get('/groupinfo', groupinfo.grouplist);
    app.post('/groupinfo/addgroup', groupinfo.addgroup);
    app.post('/groupinfo/update', groupinfo.updategroup);
    app.get('/groupinfo/group_info', groupinfo.group_info);
    app.get('/groupinfo/studentlist', groupinfo.studentlist);
    app.get('/groupinfo/group_studentlist', groupinfo.group_studentlist);
    app.post('/groupinfo/delete', groupinfo.deletegroup);
    app.post('/groupinfo/pointweight', groupinfo.pointweight);

    //For Email Module
    app.get('/sendmail', sendmail.sendmail);
    app.post('/sendmail', sendmail.sendmail);

    //CustomizeSkills module
    app.get('/points/student', pointSystem.studentList);
    app.post('/points/student/update', pointSystem.studentUpdate);
    app.get('/points/class', pointSystem.classList);
    app.post('/points/class/update', pointSystem.classUpdate);
    app.post('/points/class', pointSystem.classUpdate);

    //Chatting data mogodb   
    app.get('/teacher/chat', chat_teacher.list);
    app.post('/teacher/chat', chat_teacher.save);
    app.get('/teacher/chat_notification', chat_teacher.chat_notification);
    app.post('/teacher/update_chat', chat_teacher.update_chat);
    app.post('/teacher/remove_chat', chat_teacher.remove_chat);
    app.post('/teacher/chat_media', upload.single('message'), chat_teacher.save);

     //Chatting data MySql
     app.get('/chats', chats.list);
     app.post('/chats', chats.save);
     app.post('/chats/chat_media', upload.single('upload_file'), chats.save);
     app.post('/chats/update_chat', chats.update_chat);
     app.post('/chats/remove_chat', chats.remove_chat);
     app.get('/chats/chat_notification', chats.chat_notification);



    //checking login status
    app.post('/checkstatus', checkstatus.list);

    //Award Multiple module
    app.post('/awardmultiple/class', awardmultiple.awardClass);
    app.post('/awardmultiple/group', awardmultiple.awardGroup);

    //Reset bubbles
    app.get('/resetbubbles', resetBubbles.list);
    app.post('/resetbubbles', resetBubbles.reset);
    app.post('/resetbubbles/group', resetBubbles.resetGroup);

    //Connect Parent
    app.get('/connectparent/studentlist', connectparent.studentlist);
    app.get('/connectparent/parentinvite', connectparent.parentinvite);

    //class list AND Point weight 
    app.get('/classlist', classlist.classlist);
    app.get('/classlist/positivepointweight', classlist.positivepointweight);
    app.get('/classlist/negativepointweight', classlist.negativepointweight);
    app.get('/classlist/chaticon', classlist.chaticon);

    //Class Stories
    app.post('/classstories', classStories.saveClassStories);
    app.get('/classstories_student/list', classStories.student_classStoriesList);
    app.get('/classstories/mykidlist', classStories.mykidslist);
    app.get('/classstories/studentClasslist', classStories.studentClasslist);
    app.get('/classstories/studentclassStories', classStories.studentClassStories);
    app.get('/classstories/list', classStories.classStoriesList);
    app.post('/classstories/update', classStories.updateClassStories);
    app.post('/classstories/delete', classStories.deleteClassStories);
    app.post('/classstories/likes', classStories.likesClassStories);
    app.post('/classstories/comment', classStories.commentClassStories);
    app.get('/classstories/allPost', classStories.allpostClassStories);
    app.get('/classstories/commentDetail', classStories.allcommentClassStories);
    app.get('/classstories/likesList', classStories.likesList);
    app.post('/classstories/comment/delete', classStories.deleteComment);

    // parentclass Stories with class id
    app.get('/parentstories', classStories.parentstories);

    // class story for students
    app.get('/teacherstudentclassstoris/allPost', studentclassStories.listClassStories);

    //Student list in teacher massege 
    app.get('/studentmessagelist', studentListMsg.studentList);
    app.get('/teacherchatlist', teacherlist.teacherlistchat);

    //School list 
    app.get('/schools/list', schools.schoolsList);
    app.post('/schools/joinschools', schools.joinSchools);
    app.post('/schools/change', schools.changeSchools);
    app.get('/schools/search', schools.schoolsSearch);
    app.post('/schools/addschoolslist', schools.addSchoolsList);
    app.post('/schools/addschoolslistportal', schools.addschoolslistportal);
    app.get('/schools/teacherlist', schools.teacherList);
    app.get('/schools/teacherlistlimit', schools.teacherListLimit);
    app.post('/schools/school_update', schools.school_update);
    app.post('/schools/teacherapprove', schools.teacherApprove);
	app.get('/schools/school_details', schools.schoolDetails);
	app.get('/schools/countries', schools.CountriesSearch);
	app.get('/schools/checkuser', schools.checkUser);
	app.get('/schools/portal_teacherlist', schools.portal_teacherList);

    //Attendance
    app.get('/attendance/studentlist', attendance.studentList);
    app.post('/attendance/save', attendance.saveAttendance);
    app.get('/attendance_report', attendance_report.attendance_report);
    app.post('/attendance_reset', attendance.attendance_reset);

    //Save file in Excel format
    app.post('/upload', upload.single('upload_file'), upload_data.upload);
    app.post('/upload/update', upload.single('upload_file'), upload_data.upload_update);

    //Common upload section
    app.post('/download_exl', download_exl.download_excel);

    //Report chart for teacher, parent and student
    app.get('/report/student', report.studentReportList);
    app.get('/report/class', report.classReportList);

    app.post('/report/addremark', report.addRemark);
    app.post('/report/remove', report.removeReport);
    app.post('/report/remove/remark', report.removeRemark);
    app.get('/report/student/classreportlist', report.studentClassReportList);
    app.get('/report/all/student', report.allReportList);
   

    //Forget password
    app.post('/forgetpassword', forgetpassword.forgetPassword);

    //Refer Teacher
    app.post('/referteacher', referteacher.referTeacher);

	
	
	
	

	
	
	
    //School Story
    app.post('/schoolstory/post', upload.single('upload_file'), schoolStory.postSchoolStory);
    app.post('/schoolstory/post_update', upload.single('upload_file'), schoolStory.updatepostSchoolStory);
    app.post('/schoolstory/like', schoolStory.likeSchoolStory);
    app.get('/schoolstory/likesList', schoolStory.likesListSchoolStory);
    app.post('/schoolstory/comment', schoolStory.commentSchoolStory);
    app.get('/schoolstory/allcommentDetail', schoolStory.allCommentDetail);
    app.get('/schoolstory/allpostschoolstory', schoolStory.allPostSchoolStory);
    app.post('/schoolstory/allcommentShoolStories', schoolStory.allcommentShoolStories);
    app.post('/schoolstory/delete', schoolStory.deleteSchoolStories);
    app.post('/schoolstory/savemsgpost', schoolStory.postMsgSchoolStories);
    app.post('/schoolstory/update', schoolStory.updateMsgSchoolStories);

    //Notification
    app.post('/testnotification', notification.pushnotification);
    app.post('/getnotification', notification.getnotification);

    //To save the device id
    app.post('/save_deviceid', save_deviceid.save_deviceid);
    app.post('/save_deviceid/update', save_deviceid.save_deviceid_update);
    app.get('/save_deviceid/getdata', save_deviceid.save_deviceid_getdata);

    //Student story
    app.get('/studentstory/postlist', student_story.studentStoryList);
    app.post('/studentstory/msgpost', student_story.studentStoryMsgpost);
    app.post('/studentstory/post', upload.single('upload_file'), student_story.studentStoryPost);
    app.post('/studentstory/post_update', upload.single('upload_file'), student_story.updatePostStudentStory);
    app.post('/studentstory/post_msgupdate', student_story.updateStudentStoryMsg);
    app.post('/studentstory/approveteacher', student_story.storyApproveTeacher);
    app.post('/studentstory/postdelete', student_story.deleteStudentPost);
    app.get('/studentstory/commentdetail', student_story.commentDetail);
    app.get('/studentstory/class/postlist',student_story.classPostList);
    app.get('/studentstory/schools/list',student_story.schoolList);

    //Assignment 
    app.post('/assignment/post', upload.single('upload_file'), assignment.assignmentPost);
    app.get('/assignment/list', assignment.assignmentList);
    app.get('/assignment/assignmentListById', assignment.assignmentListById);
    app.post('/assignment/update', upload.single('upload_file'), assignment.assignmentUpdate);
    app.post('/assignment/delete', assignment.assignmentDelete);
    app.get('/assignment/submitedlist', assignment.submitedList);
    app.get('/assignment/classlist', assignment.assignmentClassList);
    app.post('/assignment/update/data', assignment.dataUpdateAssignment);
    app.get('/parent/assignment/list', assignment.parentAssignmentList);
    app.get('/student/assignment/list', assignment.studentAssignmentList);
    app.post('/assignment/submit', assignment.assignmentSubmit);
    app.get('/assignment/reminder', assignment.assignmentReminder);
    app.get('/assignment/studentlist', assignment.studentList);
    app.post('/assignment/sendnotification', assignment.sendNotification);

    //class name 
    app.get('/classname/classname_student', class_name.className);

    // api return_token
    app.get('/return_token', api_token.api_token);

    // API to get class perfomanance
    app.get('/class_perform', class_perform.class_perform);

    //Event module
    app.get('/event_responsibilty/list', event_responsibilty.list);
    app.post('/event_responsibilty/save', event_responsibilty.save);
    app.post('/event_responsibilty/remove', event_responsibilty.remove_responsibilty);
    app.post('/event_responsibilty/update', event_responsibilty.update_responsibilty);

    /* event for adding && post indal*/
    app.get('/event/list', classgenie_event.eventList); 
    app.get('/event/event_parent_list', classgenie_event.eventParentList);
    app.post('/event/add_volunteer', classgenie_event.addVolunteer);
    app.get('/event/event_student_list', classgenie_event.eventStudentList);
    app.get('/event/eventvolunteerlist', classgenie_event.eventVolunteerList); 
    app.post('/event/edit_event', classgenie_event.edit_event);
    app.post('/event/create_event', classgenie_event.create_event);
    app.get('/event/responsibilty_list', classgenie_event.responsibilty_list);
    app.get('/event/date_time_list', classgenie_event.date_time_list);
    app.post('/event/delete', classgenie_event.deleteEvent);
    app.post('/event/quit_from_volunteer', classgenie_event.quit_from_volunteer);
    app.get('/event/parent_name', classgenie_event.parent_name);    

}
module.exports.useApp = useApp;   