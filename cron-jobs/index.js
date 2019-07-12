const cron = require('node-cron')
var MailService = require('../services/MailService')
const mongoose = require('mongoose')
var User = require('../models/User')
var config = require('../config')

// Database
mongoose.connect(config.database, { useNewUrlParser: true })

function checkUsers (users) {
  var daysInMilli = (1000 * 60 * 60 * 24)
  for (var i = 0; i < users.length; i++) {
    var user = users[i]
    var currDate = new Date().getTime()
    var daysDiff = Math.floor((currDate - user.createdAt.getTime()) / (daysInMilli))
    // check if the user's had any sessions and it's been over 7 days
    if (user.pastSessions.length === 0 && daysDiff >= 7 && !user.isVolunteer) {
      MailService.sendReminder(
        {
          user: user,
          email: user.email,
          daysDiff: daysDiff
        },
        function (err) {
          if (err) {
            throw err
          } else {
            // currently not sending any email until we update the sengrid/merge contact to master
            // console.log("Email successfully sent!")
          }
        })
    }
  }
}

// scheduled to run every Monday at 4:30 pm
var everyMon430 = '30 16 * * 1'
cron.schedule(everyMon430, function () {
  console.log('---------------------')
  console.log('Running Cron Job')
  // go through all users in the database that have a pastSessions field
  User.find({ pastSessions: { $exists: true } }, function (err, users) {
    if (err) {
      throw err
    } else {
      checkUsers(users)
    }
  })
})
