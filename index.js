console.log("--- Six Degrees ---");

var request = require('request');

var artist = "Bob Marley";
var limit = "15";

var apiURL = "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&autocorrect=1&api_key=97da75badf6d8defc793b60d004c5879&format=json";
var apiArtist = "&artist="+artist;
var apiLimit = "&limit="+limit;
var req = apiURL+apiArtist+apiLimit;

var prevArtistList;

function similarArtists = 

request(req, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    body = JSON.parse(body);
  	var count = Object.keys(body.similarartists.artist).length
	console.log("artists returned: "+count);
	
	var randName = body.similarartists.artist[random(0,count-1)].name;
	console.log(randName);
	req = apiURL + randName + apiLimit;
	console.log(req);
		

  }
})

function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}