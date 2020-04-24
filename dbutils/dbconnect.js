// Configuration
var config = require('../config')
var importedMongoose = require('mongoose')

module.exports = function(parameterMongoose, callback) {
  // Database
  const mongoose = parameterMongoose || importedMongoose;
  mongoose.connect(config.database, { useNewUrlParser: true })
  var db = mongoose.connection
  db.on('error', console.error.bind(console, 'connection error:'))
  return new Promise(resolve => db.once('open', function () {
    console.log('Connected to database')
    if (callback) callback()
    resolve();
  }))
}
