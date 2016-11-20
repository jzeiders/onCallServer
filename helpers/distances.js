var gMaps = require('@google/maps').createClient({
	key: 'AIzaSyB5hhFwFd55_12b2E5K4zU5PmD2R7My0tA'
});
locations = {};

var getPos = function(place) {
	return new Promise(function(req, res) {
		if (place in locations) {
			resolve(locations[place])
		} else {
			gMaps.geocode({
				address: place
			}, function(err, response) {
				if (err) rej(err);
				locations[place] = response.json.results[0].geometry.location;
				console.log(toGeo);
			});
		}
	})
}
exports = {

	getDist: function(to, From) {
		return new Promise(function(res, rej) {
			return getPos(to).then(function(cordA) {
				return getPos(From).then(function(cordB) {
					console.log(cordA);
					console.log(cordB);
				})
			})
		});
	}
}

module.exports = exports;
