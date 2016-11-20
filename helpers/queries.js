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
	client.query("SELECT * FROM chasis WHERE in_use=false", function(err, data) {
		return data.length;
	});
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
	return new Promise(function(res, rej) {
		var query = 'SELECT * FROM jobs WHERE is_finished IS NULL OR is_finished=FALSE';
		client.query(query, function(err, data) {
			if (err) rej(err);
			res(data.rows)
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
					counts.ipi += 1;
				if (places[i] == "Local")
					counts.local += 1;
			}
			res(counts);
		});
	});
};
var jobGen = function(vessel) {
	return new Promise(function(res, rej) {
    var query = "SELECT * FROM arrival WHERE mode_of_exit='Truck' AND vessel_name=$$" + vessel + '$$'
    client.query(query, function(err, data) {
			if (err) rej(err);
			console.log(data);
			for (var i = 0; i < data.rows.length; i++) {
				var item = data.rows[i];
				var query = jobQueryConstructor(item.est_arrival, item.container_size, item.container_num, item.unload_port, item.arriving_term, item.inland_point);
				client.query(query, handler);
			}
      res();
			console.log(data.rows[0]);
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
	getLocalities: getLocalities, //
	jobGen: jobGen
};



module.exports = queries;
