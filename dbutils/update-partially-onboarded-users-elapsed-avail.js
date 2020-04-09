const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

dbconnect(mongoose, function() {
  User.find({ isVolunteer: true })
    .then(listOfUsers => {
      const pendingUpdatedUsers = listOfUsers.map(user => {
        if (!user.isOnboarded) {
          user.elapsedAvailability = 0
          return user.save().catch(e => console.log(e))
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
