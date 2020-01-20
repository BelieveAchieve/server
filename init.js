var mongoose = require('mongoose')

// Configuration
var config = require('./config')

// Database
mongoose.connect(config.database, { useNewUrlParser: true })
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('Connected to database')
  var collection = db.collection('question')
  var jsonArr = [
    'geometry',
    'algebra',
    'trigonometry',
    'precalculus',
    'calculus',
    'planning',
    'essays',
    'applications'
  ]
  for (var i = 0; i < jsonArr.length; i++) {
    try {
      var json = require('./seeds/questions/' + jsonArr[i] + '.json')
      console.log(json)
    } catch (e) {
      console.log(e)
    }
    collection.insertMany(json, function(err, result) {
      console.log(json)
      if (err) {
        throw new Error(err)
      } else {
        console.log('Successfully imported data')
        process.exit()
      }
    })
  }
})
