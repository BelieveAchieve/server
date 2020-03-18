const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')
const UserAction = require('../models/UserAction')

// Delete defaulted availability for users that have never modified their availability and delete it for students

dbconnect(mongoose, function() {
  console.log('Migrating db...')

  // Delete availabilityLastModifiedAt from all student accounts
  User.update(
    { isVolunteer: false },
    { $unset: { availabilityLastModifiedAt: '' } },
    { multi: true }
  ).catch(err => {
    if (err) {
      console.log(err)
    }
  })

  // Delete availabilityLastModifiedAt from volunteers that never updated their availability
  User.find({ isVolunteer: true })
    .then(listOfUsers => {
      const pendingUpdatedUsers = listOfUsers.map(async user => {
        const userAction = await UserAction.findOne({
          action: 'UPDATED AVAILABILITY',
          user: user.id
        })
        if (!userAction) {
          return User.update(
            { _id: user._id },
            { $unset: { availabilityLastModifiedAt: '' } }
          )
        }
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
