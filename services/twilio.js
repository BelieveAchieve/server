var config = require('../config.js')
var User = require('../models/User')
var twilio = require('twilio')
var moment = require('moment-timezone')
const async = require('async')
const client = twilio(config.accountSid, config.authToken)
const base64url = require('base64url')

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

// return query filter object limiting notifications to the available volunteers
function filterAvailableVolunteers (subtopic, options) {
  var availability = getAvailability()
  console.log(availability)

  var certificationPassed = `certifications.${subtopic}.passed`

  // Only notify admins about requests from test users (for manual testing)
  var shouldOnlyGetAdmins = options.isTestUserRequest || false

  var userQuery = {
    isVolunteer: true,
    [certificationPassed]: true,
    [availability]: true,
    isTestUser: false,
    isFakeUser: false,
    isFailsafeVolunteer: false
  }

  if (shouldOnlyGetAdmins) {
    userQuery.isAdmin = true
  }

  return userQuery
}

// get next wave of non-failsafe volunteers to notify
var getNextVolunteersFromDb = function (subtopic, notifiedUserIds, userIdsInSessions, options) {
  const userQuery = filterAvailableVolunteers(subtopic, options)

  userQuery._id = { $nin: notifiedUserIds.concat(userIdsInSessions) }

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

  // If stored phone number doesn't have international calling code (E.164 formatting)
  // then default to US number
  // @todo: normalize previously stored US phone numbers
  const fullPhoneNumber = phoneNumber[0] === '+' ? phoneNumber : `+1${phoneNumber}`

  return client.messages
    .create({
      to: fullPhoneNumber,
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

  // If stored phone number doesn't have international calling code (E.164 formatting)
  // then default to US number
  // @todo: normalize previously stored US phone numbers
  const fullPhoneNumber = phoneNumber[0] === '+' ? phoneNumber : `+1${phoneNumber}`

  // initiate call, giving Twilio the aforementioned URL which Twilio
  // opens when the call is answered to get the TwiML instructions
  return client.calls
    .create({
      url: url,
      to: fullPhoneNumber,
      from: config.sendingNumber
    })
    .then((call) => {
      console.log(`Voice call to ${phoneNumber} with id ${call.sid}`)
      return call.sid
    })
}

// the URL that the volunteer can use to join the session on the client
function getSessionUrl (sessionId) {
  const protocol = (config.NODE_ENV === 'production' ? 'https' : 'http')
  const sessionIdEncoded = base64url(Buffer.from(sessionId.toString(), 'hex'))
  return `${protocol}://${config.client.host}/s/${sessionIdEncoded}`
}

function send (phoneNumber, name, subtopic, isTestUserRequest, sessionId) {
  const sessionUrl = getSessionUrl(sessionId)
  const messageText = `Hi ${name}, a student needs help in ${subtopic} on UPchieve! Click here to start helping them now: ${sessionUrl}`

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

  const sessionUrl = getSessionUrl(options.sessionId)

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

  messageText = messageText + ` ${sessionUrl}`

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
  // get total number of available, non-failsafe volunteers in the database
  // return Promise that resolves to count
  countAvailableVolunteersInDb: function (subtopic, options) {
    return User.countDocuments(filterAvailableVolunteers(subtopic, options)).exec()
  },

  // count the number of regular volunteers that have been notified for a session
  // return Promise that resolves to count
  countVolunteersNotified: function (session) {
    return Session.findById(session._id)
      .populate('notifications')
      .exec()
      .then((populatedSession) => {
        return populatedSession.notifications
          .map((notification) => notification.volunteer)
          .filter(
            (volunteer, index, array) =>
              array.indexOf(volunteer) === index &&
             !volunteer.isFailsafeVolunteer
          )
          .length
      })
  },

  // notify both standard and failsafe volunteers
  notify: function (student, type, subtopic, options, cb) {
    const session = options.session

    // send first wave of notifications to non-failsafe volunteers
    this.notifyWave(student, type, subtopic, session, options, (modifiedSession) => {
      // send failsafe notifications
      options.session = modifiedSession
      this.notifyFailsafe(student, type, subtopic, options)
      cb(modifiedSession)
    })
  },

  // notify the next wave of volunteers, selected from those that have
  // not already been notified of the session
  // optionally executes a callback passing the updated session document after notifications are sent,
  // and the number of volunteers notified in this wave
  notifyWave: function (student, type, subtopic, session, options, cb) {
    Promise.all([
      // find previously sent notifications for the session
      Session.findById(session._id).populate('notifications').exec(),
      // find active sessions
      Session.find({ endedAt: { $exists: false } }).exec()
    ])
      .then(([populatedSession, activeSessions]) => {
      // previously notified volunteers
        const notifiedUsers = populatedSession.notifications.map((notification) => notification.volunteer)

        // volunteers in active sessions
        const userIdsInSessions = activeSessions
          .filter((activeSession) => !!activeSession.volunteer)
          .map((activeSession) => activeSession.volunteer)

        const isTestUserRequest = options.isTestUserRequest

        // notify the next wave of volunteers that haven't already been notified
        getNextVolunteersFromDb(subtopic, notifiedUsers, userIdsInSessions, {
          isTestUserRequest
        })
          .exec((err, persons) => {
            if (err) {
            // early exit
              console.log(err)
              return
            }

            // notifications to record in the database
            const notifications = []

            async.each(persons, (person, cb) => {
            // record notification in database
              const notification = new Notification({
                volunteer: person,
                type: 'REGULAR',
                method: 'SMS'
              })

              const sendPromise = send(person.phone, person.firstname, subtopic, isTestUserRequest, session._id)
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
              // retrieve the updated session document to pass to callback
                .then(() => Session.findById(session._id))
                .then((modifiedSession) => {
                  if (cb) {
                    cb(modifiedSession)
                  }
                })
                .catch(err => console.log(err))
            })
          })
      })
      .catch((err) => console.log(err))
  },

  // notify failsafe volunteers
  notifyFailsafe: function (student, type, subtopic, options) {
    const session = options && options.session

    session.populate('notifications')
      .execPopulate()
      .then((populatedSession) => {
        return Promise.all([
          student.populateForHighschoolName().execPopulate(),
          getFailsafeVolunteersFromDb().exec(),
          populatedSession.notifications
            .filter(notification => notification.type === 'REGULAR' && notification.wasSuccessful)
            .length
        ])
      })
      .then(function (results) {
        const [populatedStudent, persons, numOfRegularVolunteersNotified] = results

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
              studentFirstname: populatedStudent.firstname,
              studentLastname: populatedStudent.lastname,
              studentHighSchool: populatedStudent.highschoolName,
              isFirstTimeRequester,
              type,
              subtopic,
              desperate: options && options.desperate,
              voice: options && options.voice,
              isTestUserRequest: options && options.isTestUserRequest,
              numOfRegularVolunteersNotified: numOfRegularVolunteersNotified,
              sessionId: session._id
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
      .catch(err => {
        console.log(err)
      })
  }
}
