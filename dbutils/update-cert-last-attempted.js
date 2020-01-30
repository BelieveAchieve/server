const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')
const certKeys = [
  'algebra',
  'geometry',
  'trigonometry',
  'precalculus',
  'calculus',
  'planning',
  'essays',
  'applications'
]

dbconnect(mongoose, function() {
  User.find({ isVolunteer: true })
    .then(listOfUsers => {
      const pendingUpdatedUsers = []

      listOfUsers.forEach(user => {
        certKeys.forEach(category => {
          const hasAttemptedCategory = user.certifications[category].tries > 0
          if (hasAttemptedCategory) {
            user.certifications[category]['lastAttemptedAt'] = user.createdAt
          }
        })
        pendingUpdatedUsers.push(user.save())
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
