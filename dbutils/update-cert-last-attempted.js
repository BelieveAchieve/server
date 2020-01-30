const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

dbconnect(mongoose, function() {
  User.find({ isVolunteer: true })
    .then(listOfUsers => {
      const pendingUpdatedUsers = listOfUsers.map(user => {
        // user.toObject() should remove internal/private Mongoose object keys
        Object.keys(user.toObject().certifications).forEach(certKey => {
          const cert = user.certifications[certKey]
          const hasAttemptedCert = cert.tries > 0
          if (!cert.lastAttemptedAt && hasAttemptedCert) {
            cert.lastAttemptedAt = user.createdAt
          }
        })
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
