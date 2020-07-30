var fs = require('fs').promises;

var functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.helloWorld = functions.https.onRequest(function(request, response) {
	response.send('helloWorld!');
});

exports.testJson = functions.https.onRequest(function(request, response) {
	
	console.log('params:', typeof request.params, Array.isArray(request.params), request.params);

	return fs.readFile('test.json', 'utf8')
		.then(function(res) {
			return JSON.parse(res);
		})
		.then(function(json) {
			console.log('readFile > json:', json);
			json.params = request.params;
			return fs.writeFile('test.json', JSON.stringify(json, null, '  '), 'utf8')
				.then(function(res) {
					console.log('writeFile > res:', res);
					return json;
				});
		})
		.then(function(json) {
			return response.send('Error in testJson: ' + JSON.stringify(json));
		})
		.catch(function(err) {
			console.error('readFile > err:', err);
			return response.send('Error in testJson: ' + JSON.stringify(err), 500);
		});
});
