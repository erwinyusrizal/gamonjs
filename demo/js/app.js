var data = {
	"createdon": "2015-04-25",
	"settings": {
		"websitename": "Gamon JS"
	},
	"navigations":[
		{
			"title": "Home",
			"slug": "home",
			"url": "http://example.com/"
		},
		{
			"title": "About",
			"slug": "about",
			"url": "http://example.com/about.html"
		},
		{
			"title": "Contact",
			"slug": "contact",
			"url": "http://example.com/contact.html"
		}
	],
	"projects": [
		{
			"name": "Avenger",
			"startdate": "2015-04-01",
			"enddate": "2015-05-07",
			"totalsprint": 5,
			"team":[
				{
					"name": "Iron Man",
					"skills": ["Shooting", "Punching", "Flying"]
				},
				{
					"name": "Hulk",
					"skills": ["Punching", "Rampage", "Climbing"]
				},
				{
					"name": "Black Widow",
					"skills": ["Spying", "Fighting"]
				},
				{
					"name": "Thor",
					"skills": ["Projectile", "Teleport"]
				},
				{
					"name": "Captain America",
					"skills":["Fighting", "Shield"]
				}
			],
			"task":[
				{
					"title": "Breaking The Building",
					"startdate": "2015-04-01",
					"enddate": "2015-04-01",
					"duration": "12 Hours",
					"status": 1,
					"assignees": ["Hulk", "Thor"]
				},
				{
					"title": "Spying Ultron",
					"startdate": "2015-04-30",
					"enddate": "2015-04-30",
					"duration": "6 Hours",
					"status": 0,
					"assignees": ["Black Widow"]
				}
			]
		},
		{
			"name": "Disney",
			"startdate": "2015-04-25",
			"enddate": "2015-05-08",
			"totalsprint": 2,
			"team":[
				{
					"name": "Mickey",
					"skills": ["Communicate"]
				},
				{
					"name": "Minnie",
					"skills": ["Flirt"]
				},
				{
					"name": "Donald",
					"skills": ["Talkative"]
				}
			],
			"task":[
				{
					"title": "Teaching The Kids",
					"startdate": "2015-04-30",
					"enddate": "2015-04-30",
					"duration": "1 Hour",
					"status": 0,
					"assignees": ["Mickey", "Minnie"]
				},
				{
					"title": "Play with The Kids",
					"startdate": "2015-04-30",
					"enddate": "2015-04-30",
					"duration": "30 Minutes",
					"status": 0,
					"assignees": ["Donald"]
				}
			]
		}
	]
};

$(document).ready(function(){

	gamon.filter.register({
		"dateFormat": function(value){
			return value.split("-").reverse().join("-");
		},
		"join": function(delimiter, value){
			return value.join(delimiter);
		}
	});

	var $brand = gamon.parse('<h1><a href="{{ navigations|index(0, \'url\') }}" title="{{ settings.websitename }}">{{ settings.websitename }}</a></h1>', data);
	$('#brand').html($brand);

	var $nav = gamon.parse("nav-tpl", data);
	$('#nav').html($nav);

	var projects = gamon.loadTemplate("partials/home.html");
	$('#projects').html(gamon.parse(projects,data));
});