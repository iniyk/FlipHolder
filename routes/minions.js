"use strict";

var express = require('express');
var router = express.Router();
var path = require("path");
var _ = require('lodash');

var futil = require("../futil");
var _p = futil._p;
var _l = futil.getLogger('routes/minions.js');

function InitMinionsRouters(minions) {
  _l.info("Start to bind routes for minions.");
  /* GET minions page. */
  router.get('/', function(req, res, next) {
    _l.info("Request from " + req.ip);
    res.render('minions', { title: 'Minions 配置' });
  });

  _l.info("Start to bind routes for each minion.");
  /* Get minion pages. */
  _.forEach(minions, function(minion) {
    if (minion.name) {
      _l.info(
        "Start to bind routes for minion of " +
        minion.name
      );
      router.get('/instances/' + minion.name , function(req, res, next) {
        res.render(
          path.join('minions', minion.module_name),
          minion
        );
      });
    } else {
      _l.error("Trying to bind a minion but has no name for it.");
    }
  });

  return router;
}

module.exports.InitMinionsRouters = InitMinionsRouters;

