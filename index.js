console.log("--- Six Degrees ---");
var express = require('express');
var bodyParser = require('body-parser');
var youtube = require('youtube-feeds');
var request = require('request');
var syncFor = require('./syncFor');

var port = 3000;

var app = express();
app.use("/", express.static(__dirname+'/public'));
app.use(bodyParser());

var io = require('socket.io').listen(app.listen(port));

var previousArtistStorage = {};

io.sockets.on('connection', function (socket) {
	previousArtistStorage[socket.id] = [];

	socket.on('query', function (data) {
		
		var apiURL = "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&autocorrect=1&api_key=97da75badf6d8defc793b60d004c5879&format=json";
		var url = apiURL+"&limit=1&artist="+data;

		request(url, function (error, response, body) {
	    	if (!error && response.statusCode == 200) {
	    		getSimilarArtist(socket, body);
	    	}
		});
	});

	socket.on('disconnect', function () {
		delete previousArtistStorage[socket.id];
  	});

  	socket.on('sixFound', function () {
  		previousArtistStorage[socket.id] = [];
  	});
});


function getSimilarArtist(socket, body) {
	var info = JSON.parse(body);
	if(info.hasOwnProperty('error')) 
	{
		if(info.error == "6")
		{
			console.log("Cannot find artist");
			socket.emit('error', info.error);
		}
	}
	else if(info.hasOwnProperty('similarartists'))
	{
		var similarArtists = info.similarartists.artist;
		var length = similarArtists.length;
		//we need to hande length errors too


		var returnName = similarArtists[random(0, length-1)].name;
		
		for(var i = 0; i < similarArtists.length; i++)
		{
			previousArtistStorage[socket.id].push(similarArtists[i].name);
		}

		socket.emit('name', returnName);

		getYoutubeResults(socket, returnName);
	}
}

function getYoutubeResults(socket, name) {
	youtube.feeds.videos( { q: name+' (music)', 'max-results': 3 }, 
		function (err, data) {
			if( err instanceof Error) {
				console.log(err);
			}
			else
			{
				for(var i = 0; i < data.items.length; i++)
				{
					socket.emit('youtubeResult', {'forArtist': name, 'id': data.items[i].id, 'title': data.items[i].title});
				}
			}
		}
	);
}

function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}