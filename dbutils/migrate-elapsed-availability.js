const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

// To run downgrade:
// DOWNGRADE=true node dbutils/migrate-elapsed-availability.js
if (process.env.DOWNGRADE) {
  downgradeMigration()
} else {
  upgradeMigration()
}

function upgradeMigration() {
  dbconnect(mongoose, function() {
    console.log('Migrating db...')
    User.find({ isVolunteer: true })
      .then(listOfUsers => {
        const pendingUpdatedUsers = listOfUsers.map(user => {
          if (!user.elapsedAvailability) {
            user.elapsedAvailability = 0
            console.log(`Updating elapsed availability for user: ${user._id}`)
          }
          return user.save()
        })
        return Promise.all(pendingUpdatedUsers)
      })
      .catch(err => {
        if (err) {
          console.log(err)
        }
      })
      .finally(() => {
        console.log('disconnecting')
        mongoose.disconnect()
      })
  })
}

function downgradeMigration() {
  dbconnect(mongoose, function() {
    console.log('Downgrading db...')
    User.aggregate([
      {
        $project: { elapsedAvailability: 0 }
      },
      { $out: 'users' }
    ])
      .exec()
      .then(() => {
        console.log('Finished!')
      })
      .catch(err => console.log(err))
      .finally(() => {
        console.log('disconnecting')
        mongoose.disconnect()
      })
  })
}
