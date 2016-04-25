var express = require('express');
var deviceProxy = require('./routes/devices');
var cors = require('cors');
var publishIp = require('./publishIp')

var app = express();

app.use(cors());
app.use('/devices', deviceProxy)

var ip = require('underscore')
    .chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .find({family: 'IPv4', internal: false})
    .value()
    .address;

publishIp(ip); //Publish to central server

// catch 404 and forward to error handler
app.use(function(req, res) {
  res.sendStatus(404)
});


module.exports = app;
