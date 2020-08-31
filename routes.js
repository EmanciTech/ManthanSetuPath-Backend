var express = require('express');
var app = express();

// Defining all the routes
var index = require('./routes/index');
var category = require('./routes/category');
var service = require('./routes/service');
var contactus = require('./routes/contactus');

// Linking all the routes
app.use('/', index);
app.use('/category', category);
app.use('/service', service);
app.use('/contactus', contactus);

module.exports = app;
