const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

// To run downgrade:
// DOWNGRADE=true node dbutils/migrate-last-activity-at.js
if (process.env.DOWNGRADE) {
  downgradeMigration()
} else {
  upgradeMigration()
}

function upgradeMigration() {
  dbconnect(mongoose, function() {
    console.log('Migrating db...')
    User.aggregate([
      {
        $addFields: { lastActivityAt: '$createdAt' }
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

function downgradeMigration() {
  dbconnect(mongoose, function() {
    console.log('Downgrading db...')
    User.aggregate([
      {
        $project: { lastActivityAt: 0 }
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
