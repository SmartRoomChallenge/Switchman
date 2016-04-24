var express = require('express');
var router = express.Router();
var mdns = require('mdns-js');
var net = require('net');
var http = require('http');

//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
mdns.excludeInterface('0.0.0.0');

var browser = mdns.createBrowser('_iot-http._tcp');
browser.on('ready', function () {
	setTimeout(browser.discover, 10000);
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
	
	this.set = function(ip, socket){
		internalRepr[getId(ip)] = socket;
	}
	this.get = function(id){
		return internalRepr[id];
	}
	this.remove = function(ip){
		if(internalRepr[getId(ip)] != undefined){
			//Remove device as the connection was closed
			internalRepr[getId(ip)] = undefined;
		}
	}
	this.getIds = function(){
		return Object.keys(internalRepr);
	}
})();

browser.on('update', function (data) {
	//console.log("Found device with ip: "+data.addresses[0]+"!");
	var ip = data.addresses[0];

	var socket = net.createConnection({port:219, host: ip}, function(){
		console.log("Connection established");
		devices.set(ip, socket)
	});

	socket.on('error', function(err){
		//console.log("Could not connect to ip: "+err.message);
	});

	socket.on('close',function(err){
		console.log("Connection closed");
		devices.remove(ip);
	})
});

/* GET devices listing. */
router.get('/', function(req, res, next) {
	//console.log("request for devices");
	res.json(devices.getIds())
});

/* Forward requests to selected device */
router.all(['/:id', '/:id*'], function(req, res, next){
	if(devices.get(req.params.id) != undefined){		
		
		var device = devices.get(req.params.id);
		//Construct an http request to socket 'device'
		var options = {
			host:device.address()['address'],
			port:219,
			method: req.method,
			path: req.url.substr(req.params.id.length+1),
			headers:req.headers,
			createConnection: function(){
				return device;
			}
		}
		var proxyReq = http.request(options);
		req.pipe(proxyReq); //Pipe request body to proxy
		device.pipe(req.socket); //Pipe response to requester
	}else{
		res.sendStatus(404);
	}
})

module.exports = router;