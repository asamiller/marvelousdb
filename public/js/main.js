jQuery(document).ready(function($) {
	$('.search-type').change(function(event) {
		$('.filter-title').text( $(this).find(':selected').text() );
	});

	$('.readmore').readmore({
		maxHeight: 500,
		embedCSS: false,
		afterToggle: setDividerHeight
	});

	setDividerHeight();
	setTimeout(setDividerHeight, 1000);

	$( '.search-characters .cover-grid' ).gridrotator({
		rows : 6,
		columns : 8,
		interval : 1000,

		step            : 'random',
		maxStep         : 2,
		preventClick    : true,
		animType        : 'fadeInOut',

		w1024 : {
			rows : 8,
			columns : 6
		},
		w768 : {
			rows : 8,
			columns : 5
		},
		w480 : {
			rows : 8,
			columns : 4
		},
		w320 : {
			rows : 8,
			columns : 3
		},
		w240 : {
			rows : 8,
			columns : 3
		},
	});

	$( '.search-comics .cover-grid' ).gridrotator({
		rows : 3,
		columns : 8,
		interval : 1000,

		step            : 'random',
		maxStep         : 2,
		preventClick    : true,
		animType        : 'fadeInOut',

		heightToWidthRatio: 1.5,

		w1024 : {
			rows : 8,
			columns : 6
		},
		w768 : {
			rows : 8,
			columns : 5
		},
		w480 : {
			rows : 8,
			columns : 4
		},
		w320 : {
			rows : 8,
			columns : 3
		},
		w240 : {
			rows : 8,
			columns : 3
		},
	});
});

try {
	Typekit.load({
		loading: function() {
			// Javascript to execute when fonts start loading
			// setDividerHeight();
		},
		active: function() {
			// Javascript to execute when fonts become active
			setDividerHeight();
		},
		inactive: function() {
			// Javascript to execute when fonts become inactive
			setDividerHeight();
		}
	});
} catch(e) {}


function setDividerHeight() {
	$('.divider').height( $('.info').outerHeight() );
}