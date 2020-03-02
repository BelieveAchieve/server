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
  let promises = []
  for (var i = 0; i < jsonArr.length; i++) {
    try {
      var json = require('./seeds/questions/' + jsonArr[i] + '.json')
      console.log(json)
    } catch (e) {
      console.log(e)
    }
    
    promises.push(collection.insertMany(json));
  }
  
  Promise.all(promises)
    .then(() => {
      console.log('Successfully imported data')
      process.exit()
    })
    .catch(err => {
      throw new Error(err)
    })
})
