var express = require('express');
var deviceProxy = require('./routes/devices');

var app = express();

app.use('/devices', deviceProxy)

// catch 404 and forward to error handler
app.use(function(req, res) {
  res.sendStatus(404)
});

module.exports = app;