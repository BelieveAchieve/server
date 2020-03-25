const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

dbconnect(mongoose, function() {
  User.find()
    .then(users => {
      const userUpdates = users.map(user => {
        user.certifications.prealgebra.passed =
          user.certifications.algebra.passed
        return user.save()
      })
      return Promise.all(userUpdates)
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
