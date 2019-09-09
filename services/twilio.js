var config = require('../config.js')
var User = require('../models/User')
var twilio = require('twilio')
var moment = require('moment-timezone')
const async = require('async')
const client = twilio(config.accountSid, config.authToken)

const Session = require('../models/Session')
const Notification = require('../models/Notification')

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
    hour = (hour + 1) % 24
    if (hour === 0) {
      // check availability at midnight on the next day
      day = (day + 1) % 7
    }
  }
  if (hour >= 12) {
    if (hour > 12) {
      hour -= 12
    }
    hour = `${hour}p`
  } else {
    if (hour === 0) {
      hour = 12
    }
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

  // True if the query should include failsafe users
  var shouldGetFailsafe = options.shouldGetFailsafe

  var userQuery = {
    isVolunteer: true,
    [certificationPassed]: true,
    [availability]: true,
    isTestUser: false
  }

  if (shouldOnlyGetAdmins) {
    userQuery.isAdmin = true
  }

  if (!shouldGetFailsafe) {
    userQuery.isFailsafeVolunteer = false
  }

  const query = User.aggregate([
    { $match: userQuery },
    { $project: { phone: 1, firstname: 1 } },
    { $sample: { size: 5 } }
  ])

  return query
}

var getFailsafeVolunteersFromDb = function () {
  var userQuery = {
    'isFailsafeVolunteer': true
  }
  return User.find(userQuery)
    .select({ phone: 1, firstname: 1 })
}

function sendTextMessage (phoneNumber, messageText, isTestUserRequest) {
  console.log(`Sending SMS to ${phoneNumber}...`)

  const testUserNotice = isTestUserRequest ? '[TEST USER] ' : ''

  return client.messages
    .create({
      to: `+1${phoneNumber}`,
      from: config.sendingNumber,
      body: testUserNotice + messageText
    })
    .then(message => {
      console.log(
        `Message sent to ${phoneNumber} with message id \n` + message.sid
      )
      return message.sid
    })
}

function sendVoiceMessage (phoneNumber, messageText) {
  console.log(`Initiating voice call to ${phoneNumber}...`)

  let apiRoot
  if (config.NODE_ENV === 'production') {
    apiRoot = `https://${config.host}/twiml`
  } else {
    apiRoot = `http://${config.host}/twiml`
  }

  // URL for Twilio to retrieve the TwiML with the message text and voice
  const url = apiRoot + '/message/' + encodeURIComponent(messageText)

  // initiate call, giving Twilio the aforementioned URL which Twilio
  // opens when the call is answered to get the TwiML instructions
  return client.calls
    .create({
      url: url,
      to: `+1${phoneNumber}`,
      from: config.sendingNumber
    })
    .then((call) => {
      console.log(`Voice call to ${phoneNumber} with id ${call.sid}`)
      return call.sid
    })
}

function send (phoneNumber, name, subtopic, isTestUserRequest) {
  var messageText = `Hi ${name}, a student just requested help in ${subtopic} at app.upchieve.org. Please log in now to help them if you can!`

  return sendTextMessage(phoneNumber, messageText, isTestUserRequest)
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

  const firstTimeNotice = isFirstTimeRequester ? 'for the first time ' : ''

  const numOfRegularVolunteersNotified = options.numOfRegularVolunteersNotified

  const numberOfVolunteersNotifiedMessage = `${numOfRegularVolunteersNotified} ` +
    `regular volunteer${numOfRegularVolunteersNotified === 1 ? ' has' : 's have'} been notified.`

  let messageText
  if (desperate) {
    messageText = `Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} really needs your ${type} help ` +
      `on ${subtopic}. ${numberOfVolunteersNotifiedMessage} ` +
      `Please log in to app.upchieve.org and join the session ASAP!`
  } else {
    messageText = `Hi ${name}, student ${studentFirstname} ${studentLastname} ` +
      `from ${studentHighSchool} has requested ${type} help ` +
      `${firstTimeNotice}at app.upchieve.org ` +
      `on ${subtopic}. ${numberOfVolunteersNotifiedMessage} ` +
      `Please log in if you can to help them out.`
  }

  if (voice) {
    return sendVoiceMessage(phoneNumber, messageText)
  } else {
    return sendTextMessage(phoneNumber, messageText, isTestUserRequest)
  }
}

/**
 * Helper function to record notifications, whether successful or
 * failed, to the database
 * @param {sendPromise} a Promise that resolves to the message SID
 * @param {notification} the notification object to save
 * after the message is sent to Twilio
 * @returns a Promise that resolves to the saved notification
 * object
 */
function recordNotification (sendPromise, notification) {
  return sendPromise.then(sid => {
    // record notification in database
    notification.wasSuccessful = true
    notification.messageId = sid
    return notification
  }).catch(err => {
    // record notification failure in database
    console.log(err)
    notification.wasSuccessful = false
    return notification
  }).then(notification => {
    return notification.save()
  })
}

module.exports = {
  // notify both standard and failsafe volunteers
  notify: function (student, type, subtopic, options) {
    var isTestUserRequest = options.isTestUserRequest || false
    const session = options.session

    // standard notifications for non-failsafe volunteers
    getAvailableVolunteersFromDb(subtopic, {
      isTestUserRequest,
      shouldGetFailsafe: false
    })
      .exec((err, persons) => {
        if (err) {
          console.log(err)
          // early exit
          return
        }

        console.log(persons.map(person => person._id))
        // notifications to record in the Session instance
        const notifications = []

        async.each(persons, (person, cb) => {
          // record notification in database
          const notification = new Notification({
            volunteer: person,
            method: 'SMS'
          })
          const sendPromise = send(person.phone, person.firstname, subtopic, isTestUserRequest)
          // wait for recordNotification to succeed or fail before callback,
          // and don't break loop if only one message fails
          recordNotification(sendPromise, notification)
            .then(notification => notifications.push(notification))
            .catch(err => console.log(err))
            .finally(cb)
        },
        (err) => {
          if (err) {
            console.log(err)
          }

          // save notifications to Session instance
          session.addNotifications(notifications)
            // retrieve the updated session document
            .then(() => Session.findById(session._id))
            .then((modifiedSession) => {
              options.session = modifiedSession

              // failsafe notifications
              this.notifyFailsafe(student, type, subtopic, options)
            })
            .catch(err => console.log(err))
        })
      })
  },
  // notify failsafe volunteers
  notifyFailsafe: function (student, type, subtopic, options) {
    const session = options && options.session

    session.populate('notifications')
      .execPopulate()
      .then((populatedSession) => {
        return Promise.all([
          getFailsafeVolunteersFromDb().exec(),
          populatedSession.notifications
            .filter(notification => notification.type === 'REGULAR' && notification.wasSuccessful)
            .length
        ])
      })
      .then(function (results) {
        const [persons, numOfRegularVolunteersNotified] = results

        // notifications to record in the Session instance
        const notifications = []

        async.each(persons, (person, cb) => {
          var isFirstTimeRequester = !student.pastSessions || !student.pastSessions.length

          const notification = new Notification({
            volunteer: person,
            type: 'FAILSAFE'
          })

          if (options.voice) {
            notification.method = 'VOICE'
          } else {
            notification.method = 'SMS'
          }

          const sendPromise = sendFailsafe(
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
              isTestUserRequest: options && options.isTestUserRequest,
              numOfRegularVolunteersNotified: numOfRegularVolunteersNotified
            })
          // wait for recordNotification to succeed or fail before callback,
          // and don't break loop if only one message fails
          recordNotification(sendPromise, notification, session)
            .then(notification => notifications.push(notification))
            .catch(err => console.log(err))
            .finally(cb)
        }, (err) => {
          if (err) {
            console.log(err)
          }

          // add the notifications to the Session object
          session.addNotifications(notifications)
        })
      })
      .catch (err => {
        console.log(err)
      })
  }
}
