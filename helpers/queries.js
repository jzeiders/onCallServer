var pg = require('pg');
var Promise = require('promise')
var pgConfig = {
	user: 'awsadmin', //env var: PGUSER
	database: 'scdt', //env var: PGDATABASE
	password: process.env.AWSPASS, //env var: PGPASSWORD
	host: 'scdthack.cxjdjf9lpax5.us-west-2.rds.amazonaws.com', // Server hosting the postgres database
	port: 5432, //env var: PGPORT
	max: 10, // max number of clients in the pool
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

var connect = function() {
	return new Promise(function(res, rej) {
		client.connect(function(err) {
			if (err) rej(err);
			return res("Connected");
		});
	});
};
var disconnect = function() {
	client.end(function(err) {
		if (err) return false;
		return true;
	});
};
var jobQueryConstructor = function(arrival_time, container_size, container_id, port, terminal, destination) {
	var cols = "INSERT INTO jobs (arrival_time, container_size, container_id, port, terminal, destination)";
	var vals = " VALUES ('" + arrival_time + "'," + container_size + ",'" + container_id + "','" + port + "','" + terminal + "','" + destination + "');";
	console.log(cols + vals);
	return cols + vals;
};

var generateJobsFromArrivals = function() {
	client.query("SELECT * FROM arrival WHERE mode_of_exit='Truck'", function(err, data) {
		if (err) throw err;
		console.log("data");
		for (var i = 0; i < data.rows.length; i++) {
			var item = data.rows[i];
			var query = jobQueryConstructor(item.est_arrival, item.container_size, item.container_num, item.unload_port, item.arriving_term, item.inland_point);
			client.query(query, handler);
		}
		console.log(data.rows[0]);
	});
};
var handler = function(err, data) {
	console.log(err);
};
var chassisGen = function() {
	var sizes = [20, 40, 45];
	for (var i = 0; i < 2500; i++) {
		size = sizes[Math.floor(Math.random() * 3)];
		var query = "INSERT INTO chassis (size, is_checked_out) VALUES (" + size + ",false);"
		console.log(query);
		client.query(query, handler);
	}
};
var getChassisCount = function() {
	return new Promise(function(req, res) {
		var counts = [
			[0, 0, 0],
			[0, 0, 0]
		];
		client.query("SELECT * FROM chassis", function(err, data) {
			if (err) rej(err)
			for (var i = 0; i < data.rows.length; i++) {
				if (data.rows[i].size == 20) {
					if (!data.rows[i].is_checked_out)
						counts[1][0] += 1;
					counts[0][0] += 1;
				}
				if (data.rows[i].size == 40) {
					if (!data.rows[i].is_checked_out)
						counts[1][1] += 1;
					counts[0][1] += 1;
				}
				if (data.rows[i].size == 45) {
					if (!data.rows[i].is_checked_out)
						counts[1][2] += 1;
					counts[0][2] += 1;
				}
			}
			console.log(counts)
			res(counts)
		});
	})
};
var assignChassis = function() {
	client.query("");
};
var vesselQuery = function(vessel) {
	return new Promise(function(res, rej) {
		var counts = [0, 0, 0]
		var query = 'SELECT container_size FROM arrival WHERE vessel_name=$$' + vessel + '$$';
		console.log(query);
		client.query(query, function(err, data) {
			if (err) rej(err)
			console.log(vessel);
			console.log(data);
			var sizes = data.rows.map(function(v) {
				return v.container_size
			})
			for (var i = 0; i < sizes.length; i++) {
				if (sizes[i] == 20)
					counts[0] += 1;
				if (sizes[i] == '40')
					counts[1] += 1;
				if (sizes[i] == '45')
					counts[2] += 1;
			}
			res(counts);
		});
	});
};
var getJobs = function() {
	return new Promise(function(resolve, rej) {
		var query = 'SELECT * FROM jobs WHERE is_finished IS NULL OR is_finished=FALSE';
		client.query(query, function(err, data) {
			if (err) rej(err);
			resolve(data.rows)
		})
	});
};
var getDestinations = function(vessel) {
	return new Promise(function(res, rej) {
		var query = 'SELECT inland_point FROM arrival WHERE vessel_name=$$' + vessel + '$$';
		client.query(query, function(err, data) {
			if (err) rej(err);
			console.log(data)
			var counts = {}
			var places = data.rows.map(function(v) {
				return v.inland_point;
			});
			for (var i = 0; i < places.length; i++) {
				if (places[i] in counts) counts[places[i]] += 1
				else {
					counts[places[i]] = 0;
				}
			}
			res(counts);
		});
	});
};
var getLocalities = function(vessel) {
	return new Promise(function(res, rej) {
		var query = 'SELECT is_local FROM arrival WHERE vessel_name=$$' + vessel + '$$';
		client.query(query, function(err, data) {
			if (err) rej(err);
			var counts = {
				Local: 0,
				IPI: 0
			};
			console.log(data)
			var places = data.rows.map(function(v) {
				return v.is_local;
			});
			for (var i = 0; i < places.length; i++) {
				if (places[i] == "IPI")
					counts.IPI += 1;
				if (places[i] == "Local")
					counts.Local += 1;
			}
			res(counts);
		});
	});
};

var jobGen = function(vessel) {
	return new Promise(function(res, rej) {
		var query = "SELECT * FROM arrival WHERE mode_of_exit='Truck' AND vessel_name=$$" + vessel + '$$';
		client.query(query, function(err, data) {
			if (err) rej(err);
			console.log(data);
			for (var i = 0; i < Math.min(20, data.rows.length); i++) {
				var item = data.rows[i];
				var query = jobQueryConstructor(item.est_arrival, item.container_size, item.container_num, item.unload_port, item.arriving_term, item.inland_point);
				client.query(query, function(err, data) {
					if (err) rej(err);
				});
			}
			res();
			console.log(data.rows[0]);
		});
	});
};

var priceRandom = function() {
	var price = Math.floor(Math.random() * 400 + 100);
	var query = "UPDATE jobs SET price=floor(random()* 1500+150);"
	client.query(query, function(err, data) {
		if (err) console.log(err + "D")
		console.log("D")
	})
}
var timeRandom = function() {
	var query = "UPDATE jobs SET arrival_time = arrival_time+ id * interval '1 minute'"
	client.query(query, function(err, data) {
		if (err) console.log(err + "D")
		console.log("D")
	})
}
var fillJob = function(t_id, j_id) {
	return new Promise(function(res, rej) {
		var query = "UPDATE jobs SET trucker_id = " + t_id + "WHERE id= " + j_id + ";"
		client.query(query, function(err, data) {
			if (err) rej(err);
			res();
		});
	});
}
var getJob = function(j_id) {
	return new Promise(function(res, rej) {
		var query = "SELECT * FROM jobs WHERE id= " + j_id + ";"
		client.query(query, function(err, data) {
			if (err || data.rows.length < 1) rej(err)
			res(data.rows[0]);
		})
	});
}
var getTruckerInfo = function(t_id) {
	return new Promise(function(res, rej) {
		var query = "SELECT * FROM jobs WHERE trucker_id=" + t_id + ";"
		client.query(query, function(err, data) {
			if (err) rej(err)
			var jobs = []
			if (data)
				jobs = data.rows;
			var query = "SELECT * FROM truckers WHERE id= + " + t_id + ";";
			console.log("hi");
			client.query(query, function(err, data) {
				if (err) rej(err)
				if (!data)
					rej("Invalid ID")
        var value = data.rows[0];
				console.log(jobs + "HI");
				value.jobs = jobs;
				res(value);
			});
		});
	});
}
var client = new pg.Client(pgConfig);

var queries = {
	connect: connect, // Attempts to connect to DB;
	generateJobsFromArrivals: generateJobsFromArrivals, // Generate all jobs from arrival_data
	chassisGen: chassisGen, // Makes Chasis
	getChassisCount: getChassisCount, // Counts Chassis
	assignChassis: assignChassis, // Checkouts a Chassis
	vesselQuery: vesselQuery, // Grabs all sizes from a vessel
	getJobs: getJobs, // Returns all Jobs as a massive dump
	getDestinations: getDestinations, // Returns # of places to Destinations
	getLocalities: getLocalities, // Returns IPI Ratio
	jobGen: jobGen, // Gens Jobs
	priceRandom: priceRandom, // Assigns Prices
	timeRandom: timeRandom, // Assigns Times
	fillJob: fillJob,
	getJob: getJob,
	getTruckerInfo: getTruckerInfo
};



module.exports = queries;
