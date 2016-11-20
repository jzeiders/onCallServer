var pg = require('pg');
var Promise = require('promise')
var pgConfig = {
	user: 'awsadmin', //env var: PGUSER
	database: 'scdt', //env var: PGDATABASE
	password: 'blastER$1880', //env var: PGPASSWORD
	host: 'scdthack.cxjdjf9lpax5.us-west-2.rds.amazonaws.com', // Server hosting the postgres database
	port: 5432, //env var: PGPORT
	max: 10, // max number of clients in the pool
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

var connect = function() {
	return new Promise(function(res, rej) {
		client.connect(function(err) {
			if (err) rej(err);
			return res("Connected")
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
	var blank_job = {
		arrival_date: null,
		price: null,
		container_size: null,
		container_id: null,
		source: null,
		desination: null,
		trucker_id: null,
		is_finished: null
	};


	client.query("SELECT * FROM arrival WHERE mode_of_exit='Truck'", function(err, data) {
		if (err) throw err;
		console.log("data");
		for (var i = 0; i < sizes.length; i++) {
			var item = sizes[i];
			var query = jobQueryConstructor(item.est_arrival, item.container_size, item.container_num, item.unload_port, item.arriving_term, item.inland_point);
			client.query(query, handler);
		}
		console.log(sizes[0]);
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
    var counts = [0,0,0]
    var query = 'SELECT container_size FROM arrival WHERE vessel_name=$$' + vessel + '$$';
    console.log(query);
		client.query(query, function(err, data) {
			if (err) rej(err)
      console.log(vessel);
      console.log(data);
      var sizes = data.rows.map(function(v){
        return v.container_size
      })
      for(var i = 0; i < sizes.length;i++){
        console.log(sizes[i])
        if(sizes[i] == 20)
          counts[0]+=1;
        if(sizes[i] == '40')
          counts[1]+=1;
        if(sizes[i] == '45')
          counts[2]+=1;
      }
      res(counts);
		});
	});
};
var client = new pg.Client(pgConfig);
var queries = {
	connect: connect, // Attempts to connect to DB;
	generateJobsFromArrivals: generateJobsFromArrivals, // Generate all jobs from arrival_data
	chassisGen: chassisGen,
	getChassisCount: getChassisCount,
	assignChassis: assignChassis,
	vesselQuery: vesselQuery
};



module.exports = queries;
