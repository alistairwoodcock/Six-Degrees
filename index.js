console.log("--- Six Degrees ---");

var request = require('request');
var syncFor=require('./syncFor');

var artist = "Jim Guthrie";
var limit = 15;
var limIncrementer = 2;

//change this stuff so it just passes in the value
//not the whole &artist bit
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
	limIncrementer = 2;
	request(apiRequest = apiURL+apiA+apiL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			//TODO: When there is 2 or less artists returned we get some issues
			//		
			//		This is going to have a lot of edge cases for returning not enough
			//		similar artists if the artist is obscure and stuff so think about that too
			body = JSON.parse(body);

			var similarartists = body.similarartists.artist;
			var useableArtists = [];


			var count = Object.keys(body.similarartists.artist).length;
			console.log("artists returned: "+count);


			//makes a list of all artists which havent already been retrieved by API
			for(i = 0; i < count; i++)
			{
				if(previousArtists.indexOf(similarartists[i].name) < 0)
				{
					useableArtists.push(similarartists[i].name);
				}
			}
			var useableCount = useableArtists.length-1;
			console.log(useableCount);
			var randName = "Gorillaz"; //just currently setting a defualt but we can do this better
			if(useableCount > 0){
				randName = useableArtists[random(0,useableCount)];
				console.log("name used: "+randName);
			
			//these both set external values
			artist = randName;
			apiArtist = "&artist="+artist;

			//add recently recieved artists to list so they wont be used again
			for(var i = 0; i < count; i++) {
				previousArtists.push(similarartists[i].name);
			}

			callback();
		}
		else{
			console.log("Useable artist not found \n Doing a recursive call");
			limIncrementer++;
			getSimilarArtist(apiArtist, "&limit="+limit*limIncrementer, callback);
		}
	}
})
}


function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* calling youtube api */

function handleYoutubeResults(err, data) {
	if( err instanceof Error) {
		console.log(err);
	}
	else
	{
		for(var i = 0; i < data.items.length; i++)
		{
			console.log(data.items[i].id)
			console.log(data.items[i].title)
		}
	}
};

var youtube = require('youtube-feeds');
youtube.feeds.videos( {
        q:              'Gorillaz',
        'max-results':  2,
    }, handleYoutubeResults)
