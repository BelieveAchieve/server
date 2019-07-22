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

var getFailsafeVolunteersFromDb = function () {
  var userQuery = {
    'isFailsafeVolunteer': true
  }
  return User.find(userQuery)
    .select({ phone: 1, firstname: 1 })
}

function sendTextMessage (phoneNumber, messageText) {
  console.log(`sending sms to ${phoneNumber}...`)
  return client.messages
    .create({
      to: `+1${phoneNumber}`,
      from: config.sendingNumber,
      body: messageText
    })
    .then(message =>
      console.log(
        `Message sent to ${phoneNumber} with message id \n` + message.sid
      )
    )
}

function send (phoneNumber, name, subtopic) {
  var messageText = `Hi ${name}, a student just requested help in ` +
    `${subtopic} at app.upchieve.org. Please log in now to help them if you can!`

  sendTextMessage(phoneNumber, messageText).catch(err => console.log(err))
}

function sendFailsafe (phoneNumber, name, options) {
  var studentFirstname = options.studentFirstname

  var studentLastname = options.studentLastname

  var studentHighSchool = options.studentHighSchool

  var isFirstTimeRequester = options.isFirstTimeRequester

  var type = options.type

  var subtopic = options.subtopic

  var desperate = options.desperate

  let messageText
  if (desperate) {
    messageText = `Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} really needs your ${type} help ` +
      `on ${subtopic}. Please log in to app.upchieve.org and join the session ASAP!`
  } else {
    messageText = `Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} has requested ${type} help ` +
      `${isFirstTimeRequester ? 'for the first time' : ''} at app.upchieve.org ` +
      `on ${subtopic}. Please log in if you can to help them out.`
  }

  return sendTextMessage(phoneNumber, messageText)
}

module.exports = {
  notify: function (type, subtopic) {
    getAvailableVolunteersFromDb(subtopic).exec(function (err, persons) {
      persons.forEach(function (person) {
        send(person.phone, person.firstname, subtopic)
      })
    })
  },
  notifyFailsafe: function (student, type, subtopic, options) {
    getFailsafeVolunteersFromDb().exec()
      .then(function (persons) {
        persons.forEach(function (person) {
          var isFirstTimeRequester = !student.pastSessions || !student.pastSessions.length

          sendFailsafe(
            person.phone,
            person.firstname,
            {
              studentFirstname: student.firstname,
              studentLastname: student.lastname,
              studentHighSchool: student.highschool,
              isFirstTimeRequester,
              type,
              subtopic,
              desperate: options && options.desperate
            })
        })
      })
  }
}
