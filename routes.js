var express = require('express');
var app = express();

// Defining all the routes
var index = require('./routes/index');
var category = require('./routes/category');
var service = require('./routes/service');

// Linking all the routes
app.use('/', index);
app.use('/category', category);
app.use('/service', service);

module.exports = app;
