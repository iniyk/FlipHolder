"use strict";

var log4js = require('log4js');
var async = require('async');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var futil = require("./futil");
var _p = futil._p;
var _l = futil.getLogger('app.js');

_l.info('Log for filpholder is started.');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(log4js.connectLogger(futil.getLogger('express_connect'), { level: 'auto' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

//app.use('/users', users);

async.waterfall(
  [
    setupGru,
    setupError
  ],
  function(err) {
    if (err) {
      _l.error(err);
    }
    _l.info('Flipholder init ready!');
  }
);

function setupError(callback) {
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  callback(null);
}

function setupGru(callback) {
  // Set up socket.io for minions to send data to web-front.
  // var dataio = require('./dataio');
  // Set up Gru, Minions and Instances.
  _l.info("Start to set up module Gru.");
  var gru = require("./gru");
  var minions_routes = require("./routes/minions");
  var minions = null;

  gru.LoadMinions(
    _p("./minions.json"),
    function(err, minions_loaded) {
      if (err) {
        _l.error(err);
      } else {
        _l.info('Minions has been loaded.');
        minions = minions_loaded;

        _l.debug(minions);
        
        app.use(
          '/minions',
          minions_routes.InitMinionsRouters(minions)
        );
      }
      callback(err);
    }
  );
}

module.exports = app;
