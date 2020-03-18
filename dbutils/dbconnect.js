// Configuration
var config = require('../config')

module.exports = function(mongoose, callback) {
  // Database
  mongoose.connect(config.database, { useNewUrlParser: true })
  var db = mongoose.connection
  db.on('error', console.error.bind(console, 'connection error:'))
  db.once('open', function () {
    console.log('Connected to database')
    callback()
  })
}
