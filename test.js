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

});

app.listen(process.env.PORT || 3000, function() {
	dist.getDist("Los Angeles", "Chicago").then(function(result) {
		console.log("DIST +", result);
	}).catch(function(err) {
		console.log("err" + err);
	});
  queries.connect().then(function(){
    queries.getChassisCount().then(function(res){
      console.log("file", res);
    });
  }).catch(function(err){
    console.log(err);
  });
	console.log("Started Server");
	console.log(process.env.AWSPASS);
});
