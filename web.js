var express = require('express');
var exphbs  = require('express3-handlebars');
var querystring = require('querystring');

// our functions
var f = require('./functions.js');

var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/public'));

// handle local or cdn assets (for development or deployment)
app.use(function (req, res, next) {
	res.locals({
		assetPath: process.env.ASSET_PATH
	});
	next();
});



// HANDLEBARS HELPERS
var hbs = exphbs.create({ defaultLayout: 'main' });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

var helpers = require('./handlebars-helpers.js')(hbs.handlebars);




//  ROOT SEARCH INPUT PAGES
app.get('/', function(request, response) {
	response.render('search-characters');
});

app.get('/characters', function(request, response) {
	response.render('search-characters');
});

app.get('/comics', function(request, response) {
	response.render('search-comics');
});


// SEARCH RESULTS PAGES
app.get('/characters/search', function(request, response) {
	var query = request.query.s;
	var field = request.query.field || '';
	var gender = request.query.gender || '';
	var reality = request.query.reality || '';

	var page = parseInt(request.query.p, 10) || 1;
	var limit = 20;

	var offset = (page - 1) * limit;

	f.getCharacters({
		offset: offset,
		query: query,
		limit: limit,
		gender: gender,
		field: field,
		reality: reality
	})
	.then(function (data) {
		var pages = Math.ceil(data.body.total_count / limit);

		// kill the page object before we serialize the qs
		delete request.query.p;

		response.render('characters', {
			pagination: {
				page: page,
				pageCount: pages,
				qs: querystring.stringify(request.query)
			},
			data: data.body
		});
	})
	.fail(function(error){
		console.log(error);
		response.render('error');
	});
});




app.get('/comics/search', function(request, response) {
	var query = request.query.s;
	var field = request.query.field || '';
	var reality = request.query.reality || '';

	var page = parseInt(request.query.p, 10) || 1;
	var limit = 20;

	var offset = (page - 1) * limit;

	f.getComics({
		offset: offset,
		query: query,
		limit: limit,
		field: field
	})
	.then(function (data) {
		var pages = Math.ceil(data.body.total_count / limit);

		// kill the page object before we serialize the qs
		delete request.query.p;

		response.render('comics', {
			pagination: {
				page: page,
				pageCount: pages,
				qs: querystring.stringify(request.query)
			},
			data: data.body
		});
	})
	.fail(function(error){
		console.log(error);
		response.render('error');
	});
	
});



// GET A SINGLE CHARACTER
app.get('/character/:id', function(request, response) {
	var id = request.params.id;

	var page = parseInt(request.query.p, 10) || 1;
	var limit = 20;
	var offset = (page - 1) * limit;

	f.getCharacter(id, offset, limit)
	.then(function (data) {
		// console.log(data);
		// check if we have data, otherwise show the no data screen
		data.hasData = (data.wiki || data.description) ? true : false;

		data.linkback = 'http://marvel.com';
		if (data.urls) data.linkback = data.urls[0].url;

		var pages = Math.ceil(data.comics.total / limit);
		response.render('character', {
			pagination: {
				page: page,
				pageCount: pages,
				needed: (pages > 1)
			},
			data: data
		});
	})
	.fail(function(error){
		console.log(error);
		response.render('error');
	});
});



// GET A SINGLE COMIC
app.get('/comic/:id', function(request, response) {
	var id = request.params.id;

	f.getComic(id)
	.then(function (data) {
		// add the linkback to marvel
		data.linkback = 'http://marvel.com';
		if (data.urls) data.linkback = data.urls[0].url;

		response.render('comic', data);
	})
	.fail(function(error){
		console.log(error);
		response.render('error');
	});
});

//  404 page
app.get('*', function(request, response) {
	response.render('error');
});



// START THE SERVER
var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log('Listening on ' + port);
});