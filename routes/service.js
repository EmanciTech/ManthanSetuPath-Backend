var express = require('express')
var router = express.Router()
var db = require('../dbconfig')
var ObjectId = require('mongodb').ObjectID
var async = require("async")
var httpUtil = require('../utilities/http-messages')
var multer = require('multer')
var path = require('path')
var fs = require('fs')

var uploadDirectory = path.join(__dirname, '../uploads')
fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory)

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

router.get('/', function (req, res, next) {
  let finalResult = []
  const collection = req.query.collection ? req.query.collection : ''
  if (collection) {
    db.get().collection(collection)
      .find({})
      .toArray(async function (err, result) {
        if (err) throw err
        await asyncForEach(result, async (item) => {
          await db.get().collection(item.category)
            .find({})
            .toArray(async function (err, innerResult) {
              if (err) throw err
              await asyncForEach(innerResult, async (val) => {
                await finalResult.push(val)
              })
            })
        })
        setTimeout(() => {
          res.send(httpUtil.success(200, '', finalResult))
        }, 1000)
      })
  } else {
    res.status(500).send("Collection is missing.")
  }
})

router.post('/add', upload.any('file'), function (req, res, next) {
  const collection = req.body.collection ? req.body.collection : ''
  const category = req.body.category ? req.body.category : ''
  const service = req.body.service ? JSON.parse(req.body.service) : ''
  const files = req.files ? req.files : []
  let imageURL = ''
  let count = 0
  if (collection && category && service && (files.length > 0)) {
    async.waterfall([
      function (callback) {
        const directory = path.join(__dirname, '../uploads/' + service['name'])
        fs.existsSync(directory) || fs.mkdirSync(directory)
        files.forEach((file) => {
          fs.copyFile(path.join(__dirname, '../uploads/' + file.originalname),
            path.join(__dirname, '../uploads/' + service['name'] + '/' + file.originalname), (err) => {
              if (err) callback(err)
              imageURL = '/uploads/' + service['name'] + '/' + file.originalname
              console.log('File uploaded successfully.')
              callback(null, imageURL)
            })
        })
      },
      function (result, callback) {
        let data = {
          image: imageURL,
          category: category,
          name: service['name'],
          description: service['description']
        }
        db.get().collection(category)
          .insertOne(data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      },
      function (result, callback) {
        db.get().collection(collection)
          .find({ 'category': category })
          .toArray(function (err, result) {
            if (err) callback(err)
            count = parseInt(result[0]['records']) + 1
            callback(null, result)
          })
      },
      function (result, callback) {
        let Id = { 'category': category }
        let data = {
          $set: {
            'records': count,
            'update': new Date()
          }
        }
        db.get().collection(collection)
          .updateOne(Id, data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Service creation error.'))
      } else {
        res.send(httpUtil.success(200, 'Service created.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection or Category or Service or File is missing.'))
  }
})

router.post('/update', upload.any('file'), function (req, res, next) {
  const id = req.body.id ? ObjectId(req.body.id) : ''
  const category = req.body.category ? req.body.category : ''
  const service = req.body.service ? JSON.parse(req.body.service) : ''
  const files = req.files ? req.files : []
  let imageURL = ''
  if (id && category && service) {
    let Id = { '_id': id }
    let data = {
      $set: service
    }
    async.waterfall([
      function (callback) {
        if (files.length > 0) {
          const directory = path.join(__dirname, '../uploads/' + service['name'])
          fs.existsSync(directory) || fs.mkdirSync(directory)
          files.forEach((file) => {
            fs.copyFile(path.join(__dirname, '../uploads/' + file.originalname),
              path.join(__dirname, '../uploads/' + service['name'] + '/' + file.originalname), (err) => {
                if (err) callback(err)
                imageURL = '/uploads/' + service['name'] + '/' + file.originalname
                console.log('File uploaded successfully.')
                callback(null, imageURL)
              })
          })
        } else {
          callback(null, imageURL)
        }
      },
      function (result, callback) {
        if (files.length > 0) {
          data = {
            $set: {
              image: imageURL,
              category: category,
              name: service['name'],
              description: service['description']
            }
          }
        }
        db.get().collection(category)
          .updateOne(Id, data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Service updating error.'))
      } else {
        res.send(httpUtil.success(200, 'Service updated.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'ID or Category or Service is missing.'))
  }
})

router.delete('/delete', function (req, res, next) {
  const collection = req.query.collection ? req.query.collection : ''
  const id = req.query.id ? ObjectId(req.query.id) : ''
  const category = req.query.category ? req.query.category : ''
  let count = 0
  if (collection && id && category) {
    let Id = { '_id': id }
    async.waterfall([
      function (callback) {
        db.get().collection(category)
          .deleteOne(Id, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      },
      function (result, callback) {
        db.get().collection(collection)
          .find({ 'category': category })
          .toArray(function (err, result) {
            if (err) callback(err)
            count = parseInt(result[0]['records']) - 1
            callback(null, result)
          })
      },
      function (result, callback) {
        let Id = { 'category': category }
        let data = {
          $set: {
            'records': count,
            'update': new Date()
          }
        }
        db.get().collection(collection)
          .updateOne(Id, data, function (err, result) {
            if (err) callback(err)
            callback(null, result)
          })
      }
    ], function (err, result) {
      if (err) {
        res.status(500).send(httpUtil.error(500, 'Service deletion error.'))
      } else {
        res.send(httpUtil.success(200, 'Service deleted.', ''))
      }
    })
  } else {
    res.status(500).send(httpUtil.error(500, 'Collection or ID or Category is missing.'))
  }
})

module.exports = router;