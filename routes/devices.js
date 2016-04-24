var express = require('express');
var router = express.Router();
var mdns = require('mdns-js');
var httpProxy = require('http-proxy');

//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
mdns.excludeInterface('0.0.0.0');

var browser = mdns.createBrowser('_iot-http._tcp');
browser.on('ready', function () {
	browser.discover();
	setTimeout(browser.discover, 10000);
	console.log("Discovering every 10 seconds")
});

var devices = new (function Devices(){
	var internalRepr = {}
	var idTable = {}

	//nextId closure
	var nextId = (function(){
		var counter = 0;
		return function(){
			return counter++;
		}
	})();

	var getId = function(ip){
		if(idTable[ip] == undefined){
			idTable[ip] = nextId();
		}
		return idTable[ip]
	}
	
	this.add = function(ip){
		internalRepr[getId(ip)] = ip;
	}
	this.get = function(id){
		return internalRepr[id];
	}
	this.remove = function(ip){
		if(internalRepr[getId(ip)] != undefined){
			//Remove device as the connection was closed
			delete internalRepr[getId(ip)];
		}
	}
	this.getIds = function(){
		return Object.keys(internalRepr);
	}
})();

//This may have an internal cache that keeps as a blacklist for update
browser.on('update', function (data) {
	console.log("Found device: "+JSON.stringify(data));
	var ip = data.addresses[0];

	devices.add(ip);
});

/* GET devices listing. */
router.get('/', function(req, res, next) {
	console.log("request for devices");
	res.json(devices.getIds())
});
var proxy = httpProxy.createProxyServer();
/* Forward requests to selected device */
router.all(['/:id', '/:id*'], function(req, res, next){
	console.log("Got request for /:id");
	if(devices.get(req.params.id) != undefined){
		req.url = req.url.substr(req.params.id.length+1);		
		proxy.web(req, res, { target: 'http://'+devices.get(req.params.id)+':219'}, function(err){
			console.log("Error: "+err.message);
			devices.remove(req.params.id)
		});
	}else{
		res.sendStatus(404);
	}

})

module.exports = router;