//Old router form
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'Express',
      content: 'This is my testing content'
    });
});
module.exports = router;

//Eof of old router form

app.get('/authors', authors.list);
app.get('/authors/add', authors.add);
app.post('/authors/add', authors.save);
app.get('/authors/edit/:id', authors.edit);
app.post('/authors/edit/:id',authors.save_edit);
app.get('/authors/delete/:id', authors.delete_author);

app.locals.global = '';
req.app.get('global').fclog(rows);
res.json(data);
//Format should dev or combined

var db = monk('USERNAME:PASSWORD@localhost:27017/nodetest1');
var db = monk('localhost:27017/nodetest1', {
  username : 'USERNAME',
  password : 'PASSWORD'
});

_.extend(object1, object2);
localhost:3000/teacher/chat?token=aforetechnical@321!&teacher_id=1&parent_id=1
localhost:3000/teacher/chat?token=aforetechnical@321!
{
    "teacher_id":1,
    "parent_id":1,
    "message":"Hello world"
}

var moment = require('moment');
console.log(moment().unix());

var moment = require('moment-timezone');
console.log(moment().tz("Asia/Calcutta").unix());