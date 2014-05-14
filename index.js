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
		callAPIForSimilarArtists(socket, data, 30);
	});

	socket.on('getYouTube', function(data) {
		getTopTracks(socket, data);
	});

	socket.on('disconnect', function () {
		delete previousArtistStorage[socket.id];
  	});

  	socket.on('sixFound', function () {
  		previousArtistStorage[socket.id] = [];
  	});
});


function callAPIForSimilarArtists(socket, data, limit){
	var apiURL = "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&autocorrect=1&api_key=97da75badf6d8defc793b60d004c5879&format=json";
	var url = apiURL+"&limit="+limit+"&artist="+data;

	request(url, function (error, response, body) {
	   	if (!error && response.statusCode == 200) {
	   		getSimilarArtist(socket, body, limit, data);
	   	}
	});
}

function getSimilarArtist(socket, body, limit, name) {
	var info = JSON.parse(body);
	if(info.hasOwnProperty('error')) 
	{
		if(info.error == "6")
		{
			socket.emit('error', info.error);
		}
	}
	else if(info.hasOwnProperty('similarartists'))
	{
		var similarArtists = info.similarartists.artist;

		var useableArtists = getUsableArtists(socket.id,similarArtists);
		var length = useableArtists.length;
		
		if(useableArtists.length > 0)
		{
			var returnName = useableArtists[random(0, length-1)];
			
			//this could be its own function
			for(var i = 0; i < similarArtists.length; i++)
			{
				previousArtistStorage[socket.id].push(similarArtists[i].name.toLowerCase());
			}

			socket.emit('name', returnName);
			
			getTopTracks(socket, returnName);

		}
		else
		{
			if(limit < 90)
				callAPIForSimilarArtists(socket, name, limit*2);
			else
				socket.emit('error', '5');
		}

	}
}

function getUsableArtists(id, artists) {
	var useable = [];
	for(var i = 0; i < artists.length; i++ )
	{
		if(previousArtistStorage[id].indexOf(artists[i].name.toLowerCase()) < 0)
		{
			useable.push(artists[i].name);
		}
	}

	return useable;
}

function getTopTracks(socket, name) {
	var apiURL = "http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&autocorrect=1&api_key=97da75badf6d8defc793b60d004c5879&format=json";
	var url = apiURL+"&limit=3&artist="+name;

	request(url, function (error, response, body) {
	   	if (!error && response.statusCode == 200) {
	   		var info = JSON.parse(body);
			if(info.hasOwnProperty('error')) 
			{

			}
			else if(info.hasOwnProperty('toptracks') && info.toptracks.hasOwnProperty('track'))
			{
				var topTracks = info.toptracks.track;

				for(var i = 0; i < topTracks.length; i++)
				{
		   			getYoutubeResults(socket, name, topTracks[i].name);
				}
			}
	   	}
	});


}


function getYoutubeResults(socket, name, topTrack) {
	youtube.feeds.videos( { q: name+'  '+topTrack, 'max-results': 1, 'category':'Music' }, 
		function (err, data) {
			if( err instanceof Error) {
				console.log(err);
			}
			else
			{
				for(var i = 0; i < data.items.length; i++)
				{
					socket.emit('youtubeResult', {'forArtist': name, 'id': data.items[i].id, 'title': topTrack});
				}
			}
		});
}

function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}