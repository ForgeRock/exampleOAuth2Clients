/* example-start */
'use strict'
/* example-end */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  /* example-start */
  if (req.flash) {
    res.locals.messages = req.flash('openid-client-helper-info').concat(req.flash('openid-client-helper-warnings'))
  }

  res.render('index', { title: 'node-openid-client example' });
  /* example-end */
});

module.exports = router;
