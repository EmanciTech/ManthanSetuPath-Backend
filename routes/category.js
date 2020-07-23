var express = require('express');
var router = express.Router();
var db = require('../dbconfig');
var ObjectId = require('mongodb').ObjectID;
var async = require('async');
var httpUtil = require('../utilities/http-messages');

router.get('/', function (req, res, next) {
  const collection = req.query.collection ? req.query.collection : ''
  if (collection) {
    db.get().collection(collection)
      .find({})
      .toArray(function (err, result) {
        if (err) throw err
        res.send(httpUtil.success(200, '', result))
      })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection is missing.'))
  }
})

router.post('/add', function (req, res, next) {
  console.log(req.body)
  const collection = req.body.collection ? req.body.collection : ''
  const category = req.body.category ? req.body.category : ''
  if (collection && category) {
    let data = {
      'category': category,
      'records': 0,
      'create': new Date(),
      'update': new Date()
    }
    async.waterfall([
      function (callback) {
        db.get().listCollections({ name: category }).toArray(function (err, result) {
          if (result.length === 1) {
            res.status(500).send(httpUtil.error(500, 'Category already exists.'))
          } else {
            callback(null, result)
          }
        })
      },
      function (result, callback) {
        db.get().collection(collection)
          .insertOne(data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      },
      function (result, callback) {
        db.get().createCollection(category, function (err, result) {
          if (err) callback(err)
          callback(null, result)
        })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Category creation error.'))
      } else {
        res.send(httpUtil.success(200, 'Category created.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection or Category is missing.'))
  }
})

router.patch('/update', function (req, res, next) {
  const collection = req.body.collection ? req.body.collection : ''
  const id = req.body.id ? ObjectId(req.body.id) : ''
  const oldCategory = req.body.oldCategory ? req.body.oldCategory : ''
  const newCategory = req.body.newCategory ? req.body.newCategory : ''
  if (collection && id && oldCategory && newCategory) {
    let Id = { '_id': id }
    let data = {
      $set: {
        'category': newCategory,
        'update': new Date()
      }
    }
    async.waterfall([
      function (callback) {
        db.get().collection(collection)
          .updateOne(Id, data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      },
      function (result, callback) {
        db.get().collection(oldCategory).rename(newCategory, function (err, result) {
          if (err) callback(err)
          callback(null, result)
        })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Category updating error.'))
      } else {
        res.send(httpUtil.success(200, 'Category updated.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection or ID or Category is missing.'))
  }
})

router.delete('/delete', function (req, res, next) {
  const collection = req.query.collection ? req.query.collection : ''
  const id = req.query.id ? ObjectId(req.query.id) : ''
  const category = req.query.category ? req.query.category : ''
  if (collection && id && category) {
    let Id = { '_id': id }
    async.waterfall([
      function (callback) {
        db.get().collection(collection)
          .deleteOne(Id, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      },
      function (result, callback) {
        db.get().collection(category).drop(function (err, result) {
          if (err) callback(err)
          callback(null, result)
        })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Category deletion error.'))
      } else {
        res.send(httpUtil.success(200, 'Category deleted.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection or ID or Category is missing.'))
  }
})

module.exports = router;