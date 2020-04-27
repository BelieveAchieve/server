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
      collection: 'users',
      idField: 'email',
      files: ['test_users']
    },
    {
      folder: 'schools/',
      collection: 'schools',
      idField: 'upchieveId',
      files: ['test_high_schools']
    },
    {
      folder: 'zipcodes/',
      collection: 'zipcodes',
      idField: 'zipCode',
      files: ['test_zipcodes']
    },
    {
      folder: 'questions/',
      collection: 'question',
      idField: 'questionText',
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
    const aCollection = db.collection(seedDataMetadataItem.collection)

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

        const replacePromise = aCollection.replaceOne(idKey, record, {
          upsert: true
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
