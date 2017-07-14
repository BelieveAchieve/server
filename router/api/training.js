var express = require('express');
var session = require('express-session');
var flash = require('express-flash');
var config = require('../../config.js');
var MongoClient = require('mongodb').MongoClient;

module.exports = function(router){
  router.post('/training/question', function(req, res){
    MongoClient.connect(config.database, function(err, db) {
      if (err) throw err;
      var stats = db.collection("questions").stats();
      console.log(stats);
      console.log("finished retrieving question data from test database");
      res.json({
        msg: "finished getting question"
      });
    });
  });
};
