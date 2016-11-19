var express = require("express");

var app = express();

app.get("/", function(){

});

app.listen(3000, function(){
  console.log("Started Server");
});
