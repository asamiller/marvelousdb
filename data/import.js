var request = require('request');
var fs = require('fs');
var Q = require('q');
var async = require('async');
var gender = require('gender');
var db = require('orchestrate')('YOUR_API_KEY');



function addComics () {
	fs.readdir('./comics', function (err, list) {
		list.forEach(function (item) {
			// console.log(item, item.indexOf('.json'));
			if (item.indexOf('.json') >= 0) comicsQueue.push(item, function (err) { });
		});
	});
}


var comicsQueue = async.queue(function (task, callback) {
	var comic = require('./comics/'+task);

	console.log(comic.id, comic.title);
	
	db.put('comics', comic.id, comic)
	.then(callback)
	.fail(function (err) {
		console.log(err);
		callback();
	});

}, 5);









function addCharacters () {
	fs.readdir('./characters', function (err, list) {
		list.forEach(function (item) {
			if (item.indexOf('.json') >= 0) characterQueue.push(item, function (err) { });
		});
	});
}

function figureOutGender (name, description, categories, wikiDesc) {
	if (!description) description = wikiDesc || '';

	if (categories && categories.indexOf('Women') >= 0) {
		return 'female';
	}

	var guess = gender.guess(name);

	if (guess.confidence > 0.5) {
		return guess.gender;
	}

	var male = description.match(/ he | him | his | himself /ig) || [];
	var female = description.match(/ she | her | hers | herself | priestesses /ig) || [];

	return (male.length >= female.length) ? 'male' : 'female';
}


var characterQueue = async.queue(function (task, callback) {

	var character = require('./characters/'+task);

	// clean up data we don't need to store
	delete character.comics;
	delete character.series;
	delete character.stories;
	delete character.events;

	if (!character.wiki) character.wiki = {};

	character.gender = figureOutGender(character.wiki.real_name || character.name, character.description, character.wiki.categories, character.wiki.bio);

	console.log(character.id, character.name, character.gender);

	db.put('characters', character.id, character)
	.then(callback)
	.fail(function (err) {
		console.log(err);
		callback();
	});

}, 5);

















function appearsIn () {
	fs.readdir('./characters', function (err, list) {
		list.forEach(function (item) {
			if (item.indexOf('.json') >= 0) appearQueue.push(item, function (err) { });
		});
	});
}

var appearQueue = async.queue(function (task, qCallback) {
	var character = require('./characters/'+task);
	var comics = character.comics.items;

	var allTasks = [];

	comics.forEach(function(item){
		allTasks.push(
			function(callback){
				var comicID = item.id || item.resourceURI.split('/').pop();

				console.log('character', character.id, 'comicID', comicID);
				
				db.newGraphBuilder()
				.create()
				.from('characters', character.id)
				.related('in')
				.to('comics', comicID)

				.then(function(){
					return db.newGraphBuilder()
					.create()
					.from('comics', comicID)
					.related('characters')
					.to('characters', character.id);
				})

				.then(function(){
					callback();
				})
				.fail(function (err) {
					console.log(err.body);
					console.log('ERROR comicID', comicID, 'character.id', character.id);
					callback();
				});
			}
		);
	});

	async.series(allTasks, function(err, results){
		console.log('item done', err);
		qCallback();
	});

	
}, 5);



// RUN THESE TWO FIRST TO IMPORT THE COMICS AND CHARACTERS
addComics();
addCharacters();

// THEN ONCE THOSE ARE IMPORTED, COMMENT THEM OUT AND RUN THIS TO CREATE THE GRAPH CONNECTIONS
// appearsIn();