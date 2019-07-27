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

var getAvailableVolunteersFromDb = function (subtopic, options) {
  var availability = getAvailability()
  console.log(availability)

  var certificationPassed = subtopic + '.passed'

  // Only notify admins about requests from test users (for manual testing)
  var shouldOnlyGetAdmins = options.isTestUserRequest || false

  var userQuery = {
    isVolunteer: true,
    [certificationPassed]: true,
    [availability]: true,
    isTestUser: false,
    isAdmin: shouldOnlyGetAdmins
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
  console.log(`Sending SMS to ${phoneNumber}...`)
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

function sendVoiceMessage (phoneNumber, messageText) {
  console.log(`Initiating voice call to ${phoneNumber}...`)

  let apiRoot
  if (config.NODE_ENV === 'production') {
    apiRoot = `https://${config.host}/twiml`
  } else {
    apiRoot = `http://${config.host}/twiml`
  }

  const url = apiRoot + '/message/' + encodeURIComponent(messageText)

  return client.calls
    .create({
      url: url,
      to: `+1${phoneNumber}`,
      from: config.sendingNumber
    })
    .then((call) => {
      console.log(`Voice call to ${phoneNumber} with id ${call.sid}`)
    })
}

function send (phoneNumber, name, subtopic, isTestUserRequest) {
  var testUserNotice = isTestUserRequest ? '[TEST USER] ' : '';
  var messageText = `${testUserNotice}Hi ${name}, a student just requested help in ${subtopic} at app.upchieve.org. Please log in now to help them if you can!`

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

  var voice = options.voice

  var isTestUserRequest = options.isTestUserRequest

  var testUserNotice = isTestUserRequest ? '[TEST USER] ' : '';

  let messageText
  if (desperate) {
    messageText = `${testUserNotice}Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} really needs your ${type} help ` +
      `on ${subtopic}. Please log in to app.upchieve.org and join the session ASAP!`
  } else {
    messageText = `${testUserNotice}Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} has requested ${type} help ` +
      `${isFirstTimeRequester ? 'for the first time ' : ''}at app.upchieve.org ` +
      `on ${subtopic}. Please log in if you can to help them out.`
  }

  if (voice) {
    return sendVoiceMessage(phoneNumber, messageText)
  } else {
    return sendTextMessage(phoneNumber, messageText)
  }
}

module.exports = {
  notify: function (type, subtopic, options) {
    var isTestUserRequest = options.isTestUserRequest || false

    getAvailableVolunteersFromDb(subtopic, { isTestUserRequest }).exec(function (err, persons) {
      persons.forEach(function (person) {
        send(person.phone, person.firstname, subtopic, isTestUserRequest)
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
              desperate: options && options.desperate,
              voice: options && options.voice,
              isTestUserRequest: options && options.isTestUserRequest
            })
        })
      })
  }
}
