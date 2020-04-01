const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

const makeLowerCase = day => day.toLowerCase()

const capitalize = day => day.charAt(0).toUpperCase() + day.slice(1)

const TWELVE_HOUR_FORMAT = {
  0: '12a',
  1: '1a',
  2: '2a',
  3: '3a',
  4: '4a',
  5: '5a',
  6: '6a',
  7: '7a',
  8: '8a',
  9: '9a',
  10: '10a',
  11: '11a',
  12: '12p',
  13: '1p',
  14: '2p',
  15: '3p',
  16: '4p',
  17: '5p',
  18: '6p',
  19: '7p',
  20: '8p',
  21: '9p',
  22: '10p',
  23: '11p'
}

const TWENTY_FOUR_HOUR_FORMAT = {
  '12a': 0,
  '1a': 1,
  '2a': 2,
  '3a': 3,
  '4a': 4,
  '5a': 5,
  '6a': 6,
  '7a': 7,
  '8a': 8,
  '9a': 9,
  '10a': 10,
  '11a': 11,
  '12p': 12,
  '1p': 13,
  '2p': 14,
  '3p': 15,
  '4p': 16,
  '5p': 17,
  '6p': 18,
  '7p': 19,
  '8p': 20,
  '9p': 21,
  '10p': 22,
  '11p': 23
}

// To run downgrade:
// DOWNGRADE=true node dbutils/migrate-availability-to-24-hour.js
if (process.env.DOWNGRADE) {
  downgradeMigration()
} else {
  upgradeMigration()
}

function upgradeMigration() {
  dbconnect(mongoose, function() {
    console.log('Migrating db...')
    User.find({ isVolunteer: true })
      .lean()
      .then(listOfUsers => {
        const pendingUpdatedUsers = listOfUsers.map(user => {
          const { availability, _id } = user
          const newAvailability = {}

          for (let day in availability) {
            const dayLowerCased = makeLowerCase(day)
            if (availability.hasOwnProperty(day)) {
              newAvailability[dayLowerCased] = {}
            }

            for (let hour in availability[day]) {
              if (availability[day].hasOwnProperty(hour)) {
                const isAvailable = availability[day][hour]
                const twentyFourHourFormat = TWENTY_FOUR_HOUR_FORMAT[hour]
                newAvailability[dayLowerCased][
                  twentyFourHourFormat
                ] = isAvailable
              }
            }
          }
          return User.updateOne({ _id }, { availability: newAvailability })
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
    console.log('Migrating db...')
    User.find({ isVolunteer: true })
      .lean()
      .then(listOfUsers => {
        const pendingUpdatedUsers = listOfUsers.map(user => {
          const { availability, _id } = user
          const newAvailability = {}

          for (let day in availability) {
            const dayCapitalized = capitalize(day)
            if (availability.hasOwnProperty(day)) {
              newAvailability[dayCapitalized] = {}
            }

            for (let hour in availability[day]) {
              if (availability[day].hasOwnProperty(hour)) {
                const isAvailable = availability[day][hour]
                const twelveHourFormat = TWELVE_HOUR_FORMAT[hour]
                newAvailability[dayCapitalized][twelveHourFormat] = isAvailable
              }
            }
          }
          return User.updateOne({ _id }, { availability: newAvailability })
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
