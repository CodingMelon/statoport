let express = require('express');
let app = express();
let mongojs = require('mongojs');
let db = mongojs('statoport_db', ['statoport_db']);
let db2 = mongojs('statefacts_db', ['statefacts_db']);
let bodyParser = require('body-parser');

let port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/app/'));
app.use(bodyParser.json());

app.get('/censuses', function(request, response) {
	console.log('Server received GET request from Angular controller');

	db.statoport_db.find({}, {"name":1, "value":1, _id:0}, function(error, docs) {
		response.json(docs);
	});
});

app.get('/states', function(request, response) {
	console.log('Server received GET request from Angular controller');
	db2.statefacts_db.find({}, {"name":1, "nickname":1, "population":1, "tempjanuary":1, "tempjuly":1, "natparks":1, "percapitaincome":1, "сrimerate":1, "funfacts":1, _id:0}, function(error, docs) {
	response.json(docs);
	});

});

app.listen(port, function() {
    console.log('server starting at http://localhost:' + port);
});