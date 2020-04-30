const mongoose = require('mongoose')
const ejson = require('mongodb-extended-json')

// Configuration
const config = require('./config')

// Database
mongoose.connect(config.database, { useNewUrlParser: true })
const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))

db.once('open', function() {
  console.log('Connected to database')

  const promises = []

  // Data about the seed data we intend to import / update from this file
  const seedDataMetadata = [
    {
      folder: 'users/',
      idField: 'email',
      model: 'User',
      files: ['test_users']
    },
    {
      folder: 'schools/',
      idField: 'upchieveId',
      model: 'School',
      files: ['test_high_schools']
    },
    {
      folder: 'zipcodes/',
      idField: 'zipCode',
      model: 'ZipCode',
      files: ['test_zipcodes']
    },
    {
      folder: 'questions/',
      idField: 'questionText',
      model: 'Question',
      files: [
        'geometry',
        'algebra',
        'trigonometry',
        'precalculus',
        'calculus',
        'planning',
        'essays',
        'applications'
      ]
    }
  ]

  // For each of the above metadata items, replace each record in each file with the value from seed data
  seedDataMetadata.forEach(seedDataMetadataItem => {
    const aModel = require('./models/' + seedDataMetadataItem.model)

    seedDataMetadataItem.files.forEach(file => {
      const seedData = require('./seeds/' +
        seedDataMetadataItem.folder +
        file +
        '.json')

      // use Extended JSON to handle formats like "$date" in json files
      const deserializedSeedData = ejson.deserialize(seedData)

      deserializedSeedData.forEach(record => {
        // Build a Unique ID Key for each record to be updated. Start with empty object
        const idKey = {}

        // Add a single key/value: key is seedDataMetadataItem.idField
        idKey[seedDataMetadataItem.idField] =
          record[seedDataMetadataItem.idField]

        const replacePromise = aModel.findOneAndReplace(idKey, record, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        })

        promises.push(replacePromise)
        console.log(record)
      })
    })
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
