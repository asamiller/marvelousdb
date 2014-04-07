// Register all the handlebars helpers
// this is passed in the handlebars object


var paginate = require('handlebars-paginate');


module.exports = function(handlebars){
	handlebars.registerHelper('paginate', paginate);

	handlebars.registerHelper('breaklines', function(text, field) {
		if (!text) return '';

		// escape characters
		text = handlebars.Utils.escapeExpression(text);

	    // replace new line characters with br tag
	    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');

	    // activate wiki lings
	    text = activateLinks(text, field);

	    return new handlebars.SafeString(text);
	});

	handlebars.registerHelper('default', function(text, value) {
		if (!text || !text.length) text = value;
		return new handlebars.SafeString(text);
	});

	handlebars.registerHelper('makelinks', function(text, field) {
		return new handlebars.SafeString(activateLinks(text, field));
	});

	function activateLinks (text, field) {
		if (!text) return '';

		// strip out image links
		text = text.replace(/\[\[(image):([^\]]+)\]\]/igm, '');

		// strip out glossary links
		text = text.replace(/\[\[glossary:([^\]]+)\]\]/igm, function (match, p1, p2, p3, offset, string) {
			var splitParts = p1.split('|');
			if (splitParts.length > 1) return splitParts[1];
			return p1;
		});

		// limit the links to a field
		var fieldLink = (typeof field === 'string') ? '&amp;field=' + field : '';

		// replace [[X]] links
		function replacer(match, p1, p2, p3, offset, string) {
			var splitParts = p1.split('|');

			if (splitParts.length > 1) {
				return '<a href="/characters/search?s='+encodeURIComponent(splitParts[0])+fieldLink+'">' + splitParts[1] + '</a>';
			}

			return '<a href="/characters/search?s='+encodeURIComponent(p1)+fieldLink+'">' + p1 + '</a>';
			
		};
		// return text.replace(/\[\[([\w, \(\)\|\-:#,\.']+)\]\]/igm, replacer);
		return text.replace(/\[\[([^\]]+)\]\]/igm, replacer);
	}

	handlebars.registerHelper('times', function(n, block) {
		var accum = '';
		for(var i = 0; i < n; ++i)
			accum += block.fn(i);
		return accum;
	});

	handlebars.registerHelper('random', function(n, max, block) {
		var accum = '';
		for(var i = 0; i < n; ++i)
			accum += block.fn(Math.round(Math.random() * max));
		return accum;
	});
}