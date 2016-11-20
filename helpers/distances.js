var gMaps = require('@google/maps').createClient({
	key: 'AIzaSyB5hhFwFd55_12b2E5K4zU5PmD2R7My0tA'
});

exports = {
	getDist: function(to, From) {
		return new Promise(function(res, rej) {
			gMaps.geocode({
				address: to
			}, function(err, response) {
				if (err) rej(err);
				var toGeo = response.json.results[0].geometry.location;
        console.log(toGeo);
        gMaps.geocode({
					address: From
				}, function(err, response) {
					if (err) rej(err);
					var fromGeo = response.json.results[0].geometry.location;
          console.log(fromGeo);
          gMaps.distanceMatrix({
							origins: fromGeo,
							destinations: toGeo
						},
						function(err, res) {
							if (err) rej(err);
							res(res);
						});
				});
			});
		});
	}
}

module.exports = exports;
