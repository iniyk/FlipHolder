"use strict";

var express = require('express');
var router = express.Router();

var futil = require('../futil');
var _l = futil.getLogger('routes/index.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  _l.info("Request from " + req.ip);
  res.render('index', { title: 'Express' });
});

module.exports = router;
