var express = require('express')
var router = express.Router()
var db = require('../dbconfig')
var async = require('async')
var httpUtil = require('../utilities/http-messages')

router.get('/dashboard', function(req, res, next) {
  let data = {
    construction: [],
    environmental: [],
    medical: []
  }
  async.waterfall([
    function (callback) {
      db.get().collection('construction')
      .find({})
      .toArray(function (err, result) {
        if (err) callback(err)
        data['construction'] = result
        callback(null, data)
      })
    },
    function (result, callback) {
      db.get().collection('environmental')
      .find({})
      .toArray(function (err, result) {
        if (err) callback(err)
        data['environmental'] = result
        callback(null, data)
      })
    },
    function (result, callback) {
      db.get().collection('medical')
      .find({})
      .toArray(function (err, result) {
        if (err) callback(err)
        data['medical'] = result
        callback(null, data)
      })
    }
  ], function (err, result) {
    if (err) {
      res.status(500).send(httpUtil.error(500, 'Dashboard data error.'))
    } else {
      res.send(httpUtil.success(200, 'Dashboard Data Fetched.', data))
    }
  })
});

module.exports = router;
