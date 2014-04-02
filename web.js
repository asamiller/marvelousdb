var express = require('express');
var exphbs  = require('express3-handlebars');
var paginate = require('handlebars-paginate');
var querystring = require('querystring');

// our functions
var f = require('./functions.js');

var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/public'));



// HANDLEBARS HELPERS
var hbs = exphbs.create({ defaultLayout: 'main' });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

hbs.handlebars.registerHelper('paginate', paginate);

hbs.handlebars.registerHelper('breaklines', function(text) {
	if (!text) return '';

	// escape characters
    text = hbs.handlebars.Utils.escapeExpression(text);

    // replace new line characters with br tag
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');

    // activate wiki lings
    text = activateLinks(text);

    return new hbs.handlebars.SafeString(text);
});

hbs.handlebars.registerHelper('default', function(text, value) {
    if (!text || !text.length) text = value;
    return new hbs.handlebars.SafeString(text);
});

hbs.handlebars.registerHelper('makelinks', function(text) {
    return new hbs.handlebars.SafeString(activateLinks(text));
});

function activateLinks (text) {
	if (!text) return '';

	// strip out image links
	text = text.replace(/\[\[(image):([^\]]+)\]\]/igm, '');

	// strip out glossary links
	text = text.replace(/\[\[glossary:([^\]]+)\]\]/igm, function (match, p1, p2, p3, offset, string) {
		var splitParts = p1.split('|');
		if (splitParts.length > 1) return splitParts[1];
		return p1;
	});

	// replace [[X]] links
	function replacer(match, p1, p2, p3, offset, string) {
		var splitParts = p1.split('|');

		if (splitParts.length > 1) {
			return '<a href="/characters/search?s='+encodeURIComponent(splitParts[0])+'">' + splitParts[1] + '</a>';
		}

		return '<a href="/characters/search?s='+encodeURIComponent(p1)+'">' + p1 + '</a>';
		
	};
	// return text.replace(/\[\[([\w, \(\)\|\-:#,\.']+)\]\]/igm, replacer);
	return text.replace(/\[\[([^\]]+)\]\]/igm, replacer);
}

hbs.handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});

hbs.handlebars.registerHelper('random', function(n, max, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(Math.round(Math.random() * max));
    return accum;
});




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

	f.getCharacter(id)
	.then(function (data) {
		response.render('character', data);
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
		response.render('comic', data);
	})
	.fail(function(error){
		console.log(error);
		response.render('error');
	});
});



// START THE SERVER
var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log('Listening on ' + port);
});