console.log("--- Six Degrees ---");

var request = require('request');
var syncFor=require('./syncFor');

var artist = "Bob Marley";
var limit = "25";

var apiURL = "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&autocorrect=1&api_key=97da75badf6d8defc793b60d004c5879&format=json";
var apiArtist = "&artist="+artist;
var apiLimit = "&limit="+limit;
var req = apiURL+apiArtist+apiLimit;

var previousArtists = [];


syncFor(0,6,"start",function(i,status,call)
{
	if(status === "done")
		console.log("array iteration is done")
	else
		getSimilarArtist(apiArtist, apiLimit, function(){ call('next') })
})

function getSimilarArtist(apiA, apiL, callback) {
	request(apiRequest = apiURL+apiA+apiL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			//TODO: We need to make a getUsabe for the artist names which returns
			//		a list of the artists we can use. If the list is empty it means
			//		we need a bigger set so we call the api again for double the original 
			//		searh size. Or maybe less keep thinking about this.
			//		
			//		This is going to have a lot of edge cases for returning not enough
			//		similar artists if the artist is obscure and stuff so think about that too

			body = JSON.parse(body);

			var count = Object.keys(body.similarartists.artist).length;
			console.log("artists returned: "+count);

			var randName = body.similarartists.artist[random(0,count-1)].name;
			console.log(randName);
			console.log(previousArtists.indexOf(randName));
			
			//these both set external values
			artist = randName;
			apiArtist = "&artist="+artist;

			//add recently recieved artists to list so they wont be used again
			var similarartists = body.similarartists.artist;
			for(var i = 0; i < similarartists.length; i++) {
				previousArtists.push(similarartists[i].name);
			}

			callback();

		}
	})
}


function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}