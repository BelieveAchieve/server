var config = require('../config.js')
var User = require('../models/User')
var twilio = require('twilio')
var moment = require('moment-timezone')
const client = twilio(config.accountSid, config.authToken)

// todo
// limit instead of stopping at the index of 3
// move code to separate functions
// foreach
// limit data response from server
// lodash
// ensureindex
// logging

function getAvailability () {
  var dateString = new Date().toUTCString()
  var date = moment.utc(dateString).tz('America/New_York')
  var day = date.isoWeekday() - 1
  var hour = date.hour()
  var min = date.minute() / 60

  if (min >= 0.5) {
    hour++
  }
  if (hour > 12) {
    hour = `${hour - 12}p`
  } else {
    hour = `${hour}a`
  }

  var days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ]

  return `availability.${days[day]}.${hour}`
}

var getAvailableVolunteersFromDb = function (subtopic) {
  var availability = getAvailability()
  console.log(availability)

  var certificationPassed = subtopic + '.passed'

  var userQuery = {
    [certificationPassed]: true,
    [availability]: true,
    registrationCode: 'COACH18'
  }

  var query = User.find(userQuery)
    .select({ phone: 1, firstname: 1 })
    .limit(5)

  return query
}

function send (phoneNumber, name, subtopic) {
  client.messages
    .create({
      to: `+1${phoneNumber}`,
      from: config.sendingNumber,
      body: `Hi ${name}, a student just requested help in ${subtopic} at app.upchieve.org. Please log in now to help them if you can!`
    })
    .then(message =>
      console.log(
        `Message sent to ${phoneNumber} with message id \n` + message.sid
      )
    )
    .catch(err => console.log(err))
}

module.exports = {
  notify: function (type, subtopic) {
    getAvailableVolunteersFromDb(subtopic).exec(function (err, persons) {
      persons.forEach(function (person) {
        send(person.phone, person.firstname, subtopic)
      })
    })
  }
}
