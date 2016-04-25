var http = require('http');
var querystring = require('querystring');

module.exports = function publishIp(ip){
	var post_data = querystring.stringify({
      'apiKey' : '6YJhgwrnVYwF7KR',
      'apiSecret': '8pyeitR02Dck7CRu1ZpJatp650xas2',
      'ip': ip
 	});
	var post_options = {
		host: 'demo.smartroomchallenge.net',
		path: '/api',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(post_data)
		}
	};

	// Set up the request
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
	});
	post_req.write(post_data);
}