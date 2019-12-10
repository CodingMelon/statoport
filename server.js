let express = require('express');
let app = express();
let mongojs = require('mongojs');
let db = mongojs('statoport_db', ['statoport_db']);
let bodyParser = require('body-parser');

let port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/app/'));
app.use(bodyParser.json());

// let states = [
// 	{
// 		name: 'Alabama',
// 		num: 11.24
// 	},
// 	{
//         name: 'Alaska',
// 		num: 18.58
// 	},
// 	{
// 		name: 'Arizona',
// 		num: 10.64
// 	}
// ]

app.get('/censuses', function(request, response) {
	console.log('Server received GET request from Angular controller');

	db.statoport_db.find({}, {"name":1, "value":1, _id:0}, function(error, docs) {
		response.json(docs);
	});
});

// app.get('/states', function(request, response) {
// 	console.log('Server received GET request from Angular controller');
// 	console.log(states);
// });

app.listen(port, function() {
    console.log('server starting at http://localhost:' + port);
});