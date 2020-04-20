const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const UserAction = require('../models/UserAction')

dbconnect(mongoose, function() {
  console.log('Migrating db...')
  UserAction.deleteMany({
    actionType: 'PROFILE',
    user: { $exists: false }
  })
    .then(() => {
      return UserAction.update({ actionType: 'PROFILE' }, { actionType: 'ACCOUNT' })
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
