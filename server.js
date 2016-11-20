var express = require("express");
var queries = require("./helpers/queries.js");

var app = express();

app.get("/", function() {

});

app.listen(3000, function() {
	console.log("Started Server");
	queries.connect().then(function(data){
		queries.generateJobsFromArrivals();
  }
).catch(function(err){
  console.log(err);
});

});
