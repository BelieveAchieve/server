const mongoose = require('mongoose')
const base64url = require('base64url')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

dbconnect(mongoose, function() {
  User.find()
    .then(users => {
      const userUpdates = users.map(user => {
        user.referralCode = base64url(Buffer.from(user.id, 'hex'))
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
