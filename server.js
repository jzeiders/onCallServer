var express = require("express");
var queries = require("./helpers/queries.js");
var bodyParser = require('body-parser');
var app = express();
var dist = require("./helpers/distances.js");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

app.get("/", function() {
	res.send("BLACK FIN APPLICATION SUITE")
});
app.post("/vessel", function(req, res) {
	var vessel = req.body.vessel;
	console.log(vessel + "Vessel");
	queries.vesselQuery(vessel).then(function(data) {
		res.send(data);
	});
});
app.get("/jobs", function(req, res) {
	queries.getJobs().then(function(data) {
		res.send(data);
	});
});

app.post("/addVessel", function(req, res) {
	var vessel = req.body.vessel;

});
app.post("/destinations", function(req, res) {
	var vessel = req.body.vessel;
	queries.getDestinations(vessel).then(function(data) {
		res.send(data);
	});
});
app.post("/locality", function(req, res) {
	var vessel = req.body.vessel;
	queries.getLocalities(vessel).then(function(data) {
		res.send(data);
	});
});
app.post("/jobGen", function(req, res) {
	var vessel = req.body.vessel;
	queries.jobGen(vessel).then(function(data) {
		res.send("Success");
	}).catch(function(err) {
    res.status(101);
    res.send('Faile');
	});
});
app.get("/chassis", function(req,res){
  queries.getChassisCount().then(function(data){
    res.send(data);
  }).catch(function(err){
    res.send(err);
  });
});
app.post("/fillJob", function(req,res){
  var t_id = req.body.trucker_id;
  var j_id = req.body.job_id;
  queries.fillJob(t_id,j_id).then(function(){
    res.send("Success");
  }).catch(function(err){
    console.log(err)
    res.send(err);
  });
});
app.post("/getJob", function(req,res){
  var j_id = req.body.job_id;
  queries.getJob(j_id).then(function(data){
    res.send(data);
  }).catch(function(rej){
    res.send(err);
  });
});
app.post("/getTruckerInfo", function(req,res){
  var t_id = req.body.trucker_id;
  queries.getTruckerInfo(t_id).then(function(data){
    res.send(data);
  }).catch(function(err){
    console.log(err);
    res.send(err);
  });
});
app.listen(process.env.PORT || 3000, function() {
	queries.connect().then(function(data) {
		console.log("Connected");
	}).catch(function(err) {
		console.log(err);
	});

});
