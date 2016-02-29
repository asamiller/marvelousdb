var orc = require('orchestrate');
orc.ApiEndPoint = process.env.ORCHESTRATE_API_END_POINT;
var db = orc(process.env.ORCHESTRATE_API_KEY);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
var Q = require('q');

// GET A SINGLE CHARACTER
// passed in the character ID and optional pagination page
exports.getCharacter = function (id, page) {
	var out = {};
	var comicResults;

	// Get the character data
	var character = db.get('characters', id)
	.then(function(results){
		out = results.body;
		cleanUpCharacterData(out);
	});

	// get the comics for this character
	var comics = getComicsByCharacter(id, page)
	.then(function (results) {
		comicResults = results;
	});

	// join the results and return them
	return Q.all([ character, comics ])
	.then(function () {
		out.comics = comicResults;
		return out;
	});

}


// SEARCH CHARACTERS
exports.getCharacters = function (options) {
	var options = options || {};

	// if no term is specified, get everything
	if (!options.query) options.query = '*';

	// Build search query
	var queries = [];

	if (options.field) {
		if (options.field == 'wiki.real_name') {
			queries.push( '(value.wiki.real_name: ' + options.query + ' OR value.wiki.aliases:' + options.query + ')' );
		}
		else {
			queries.push( 'value.' + options.field + ': ' + options.query );
		}
	} else {
		queries.push( options.query );
	}

	if (options.gender) {
		queries.push( 'value.gender: "' + options.gender + '"' );
	}

	if (options.reality) {
		queries.push( 'value.wiki.universe: ' + options.reality + '' );
	}


	return db.newSearchBuilder()
	.collection('characters')
	.limit(options.limit || 50)
	.offset(options.offset || 0)
	.query(queries.join(' AND '))
	.then(function(response){
		response.body.results.forEach(function (item) {
			cleanUpCharacterData(item.value);
		});

		return response;
	});
}







// SEARCH ALL COMICS
exports.getComics = function (options) {
	var options = options || {};

	// if no term is specified, get everything
	if (!options.query) options.query = '*';

	// Build search query
	var queries = [];

	if (options.field) {
		queries.push( 'value.' + options.field + ': ' + options.query );
	} else {
		queries.push( options.query );
	}

	return db.newSearchBuilder()
	.collection('comics')
	.limit(options.limit || 50)
	.offset(options.offset || 0)
	.query(queries.join(' AND '))
	.then(function(response){
		response.body.results.forEach(function (item) {
			cleanUpComicData(item.value);
		});

		return response;
	});
}




// GET SINGLE COMIC
exports.getComic = function (id) {
	var out = {};
	var characterResults;

	// Get the character data
	var comic = db.get('comics', id)
	.then(function(results){
		out = results.body;

		// split the title into title and subtitle
		var temp = out.title.search(/(:|\()/mi);

		// keep the paranthasis but not the colon
		var skipChar = (out.title.indexOf(':') >= 0) ? 1:0;

		if (temp >= 0) {
			out.subtitle = out.title.substring(temp+skipChar);
			out.title = out.title.substring(0, temp);
		}

		// replace and <br> or \r characters
		if (out.description) out.description = out.description.trim().replace(/(<br>|\r)/gmi, '\n').trim();
	});

	// get the comics for this character
	var characters = getCharactersByComic(id)
	.then(function (results) {
		characterResults = results.body.results;
	});

	// join the results and return them
	return Q.all([ comic, characters ])
	.then(function () {
		out.characters = characterResults;
		return out;
	});

}


// GET COMICS BY CHARACTER ID
// passed in Character ID and optional pagination page
//
// right now Orchestrate doesn't support limits and pagination
// in the graph results so we will get them all and limit the results
function getComicsByCharacter (id, offset, limit) {
	var limit = limit || 20;
	var end = offset + limit;

	console.log(id, offset, end, limit);

	return db.newGraphReader()
	.get()
	.from('characters', id)
	.related('in')
	.then(function (results) {
		// limit it to a max number of results
		return {
			total: results.body.results.length,
			results: results.body.results.slice(offset, end)
		};
	});
}

// FIND ALL CHARACTER THAT APPEAR IN A COMIC
function getCharactersByComic (id) {
	return db.newGraphReader()
	.get()
	.from('comics', id)
	.related('characters');
}



// breaks the character name onto two lines for display
function cleanUpCharacterData (out) {
	// split the name by ()'s into subtitle
	var temp = out.name.indexOf('(');

	if (temp >= 0) {
		out.subtitle = out.name.substring(temp);
		out.name = out.name.substring(0, temp);
	}

	// split the wiki data into an array
	if (out.wiki && out.wiki.debut) out.wiki.debut = out.wiki.debut.split(',');
	if (out.wiki && out.wiki.origin) out.wiki.origin = out.wiki.origin.split(',');
}

// breaks the comic name onto two lines for display
function cleanUpComicData (out) {
	// split the name by ()'s into subtitle
	var temp = out.title.indexOf('(');

	if (temp >= 0) {
		out.subtitle = out.title.substring(temp);
		out.title = out.title.substring(0, temp);
	}
}
