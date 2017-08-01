var mongoose = require('mongoose');

// Configuration
var config = require('./config');

// Database
mongoose.connect(config.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('Connected to database');
  var collection = db.collection('question');
	try {
		var json = require('./primer-dataset.json');
	} catch (e) {
		console.log(e);
	}
  collection.insertMany(json, function(err,result) {
    console.log(json);
    if (err) {
      throw new Error(err);
    }
    else {
      console.log('Successfully imported data');
      process.exit();
    }
  });
});
