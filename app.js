process.env.TZ = 'Asia/Kolkata';
var express = require('express');
var path = require('path');
var fs = require('fs');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var mongo = require('mongodb');

//Include all the common class
var config = require('./common/config');
var _global = require('./common/global');
var connection = require('./common/connection');
var wp_connection = require('./common/wp_connection');


var app = express();


//Set variable
app.set('connection', connection);
app.set('wp_connection', wp_connection);
app.set('global', _global);
app.set('config', config);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));


//Define all routes
require('./routes').useApp(app);


//Log management
var accessLogStream = fs.createWriteStream(__dirname + '/logs/'+_global.formatDate()+'.log', {flags: 'a'})
if(config.log){
  if(config.format == 'combined')
     app.use(logger('combined',{stream: accessLogStream}));
  else
     app.use(logger('dev'));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (config.env === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
