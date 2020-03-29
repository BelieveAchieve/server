const mongoose = require('mongoose')
const ejson = require('mongodb-extended-json')

// Configuration
var config = require('./config')

// Load approved seed files from seeds/ into the Database
mongoose.connect(config.database, { useNewUrlParser: true })
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('Connected to database')
  const questionCollection = db.collection('question')
  const approvedQuestionSeeds = [
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
  // Load question seeds into database
  for (var i = 0; i < approvedQuestionSeeds.length; i++) {
    try {
      var json = require('./seeds/questions/' +
        approvedQuestionSeeds[i] +
        '.json')
      console.log(json)
      promises.push(questionCollection.insertMany(json))
    } catch (e) {
      console.log(e)
    }
  }

  // Load school seeds into database
  const approvedSchoolSeeds = ['test_high_schools']
  // Leverage Mongoose schemas because they allow us to insert/update on keyed collections
  const dbconnect = require('./dbutils/dbconnect')
  const School = require('./models/School')
  dbconnect(mongoose, function() {
    // For each approved file
    for (var i = 0; i < approvedSchoolSeeds.length; i++) {
      try {
        var schoolSeedData = require('./seeds/schools/' +
          approvedSchoolSeeds[i] +
          '.json')
        const deserializedSchoolSeedData = ejson.deserialize(schoolSeedData)
        // for each item in each approved file, update the record
        deserializedSchoolSeedData.forEach(school => {
          School.updateOne(
            { upchieveId: school.upchieveId },
            { $set: school },
            { new: true, upsert: true },
            (err, raw) => {
              if (err) {
                console.log('Error loading approved schools seed data: ' + err)
              } else {
                console.log(school)
              }
            }
          )
        })
      } catch (e) {
        console.log(e)
      }
    }
  })

  Promise.all(promises)
    .then(() => {
      console.log('Successfully imported data')
      process.exit()
    })
    .catch(err => {
      throw new Error(err)
    })
})
