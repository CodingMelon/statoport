let express = require('express');
let app = express();
let port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/app/'));

let states = [
	{
		name: 'Alabama',
		num: 11.24
	},
	{
        name: 'Alaska',
		num: 18.58
	},
	{
		name: 'Arizona',
		num: 10.64
	}
]

app.get('/states', function(request, response) {
	console.log('Server received GET request from Angular controller');
	console.log(states);
});

app.listen(port, function() {
    console.log('server starting at http://localhost:' + port);
});