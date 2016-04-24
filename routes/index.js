var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*WebSocket to stream to client available services as they appear from switchman¡*/
var wss = new WebSocketServer({server: server, path: "/"});
var mdns = require('mdns-js');
//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
mdns.excludeInterface('0.0.0.0');

var browser = mdns.createBrowser('_iot-http._tcp');
browser.on('ready', function () {
    browser.discover(); 
});

var currentData = {}
browser.on('update', function (data) {
	var iotThing = {}
	iotThing.name = data.fullname.match(/^*(?=\.)/)
	iotThing.host = data.host
	iotThing.port = 219
	iotThing.ip = data.addresses[0]

	function broadcastJSON(obj) {
		wss.clients.forEach(function (conn) {
			conn.send(JSON.stringify(obj))
		})
	}
	currentData = iotThing;
	broadcastJSON(iotThing);
});

wss.on('connection', function connection(ws) {
	ws.send(JSON.stringify(currentData));
});

module.exports = router;
