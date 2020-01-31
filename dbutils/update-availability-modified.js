const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

dbconnect(mongoose, function() {
  User.find({ isVolunteer: true })
    .then(listOfUsers => {
      const pendingUpdatedUsers = listOfUsers.map(user => {
        if (!user.availabilityLastModifiedAt) {
          user.availabilityLastModifiedAt = user.createdAt
          console.log(`Updating availability for user: ${user._id}`)
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
