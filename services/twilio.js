var config = require('../config.js')
var User = require('../models/User')
var twilio = require('twilio')
var moment = require('moment-timezone')
const twilioClient =
  config.accountSid && config.authToken
    ? twilio(config.accountSid, config.authToken)
    : null
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

const SessionTimeout = function(sessionId, timeouts, intervals) {
  this.sessionId = sessionId
  this.timeouts = timeouts
  this.intervals = intervals
}

const sessionTimeouts = {} // sessionId => SessionTimeout

// get the availability field to query for the current time
function getAvailability() {
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
function filterAvailableVolunteers(subtopic, options) {
  var availability = getAvailability()
  console.log(availability)

  var certificationPassed = `certifications.${subtopic}.passed`

  // Only notify volunteer test users about requests from student test users (for manual testing)
  var shouldOnlyGetTestUsers = options.isTestUserRequest || false

  var userQuery = {
    isVolunteer: true,
    [certificationPassed]: true,
    [availability]: true,
    isTestUser: shouldOnlyGetTestUsers,
    isFakeUser: false,
    isFailsafeVolunteer: false
  }

  return userQuery
}

// get next wave of non-failsafe volunteers to notify
var getNextVolunteersFromDb = function(
  subtopic,
  notifiedUserIds,
  userIdsInSessions,
  options
) {
  const userQuery = filterAvailableVolunteers(subtopic, options)

  userQuery._id = { $nin: notifiedUserIds.concat(userIdsInSessions) }

  const query = User.find(userQuery).populate(
    'volunteerLastNotification volunteerLastSession'
  )

  return query
}

// query failsafe volunteers to notify
var getFailsafeVolunteersFromDb = function() {
  var userQuery = {
    isFailsafeVolunteer: true
  }
  return User.find(userQuery).select({ phone: 1, firstname: 1 })
}

function sendTextMessage(phoneNumber, messageText, isTestUserRequest) {
  console.log(`Sending SMS to ${phoneNumber}...`)

  const testUserNotice = isTestUserRequest ? '[TEST USER] ' : ''

  // If stored phone number doesn't have international calling code (E.164 formatting)
  // then default to US number
  // @todo: normalize previously stored US phone numbers
  const fullPhoneNumber =
    phoneNumber[0] === '+' ? phoneNumber : `+1${phoneNumber}`

  return twilioClient.messages
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

function sendVoiceMessage(phoneNumber, messageText) {
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
  const fullPhoneNumber =
    phoneNumber[0] === '+' ? phoneNumber : `+1${phoneNumber}`

  // initiate call, giving Twilio the aforementioned URL which Twilio
  // opens when the call is answered to get the TwiML instructions
  return twilioClient.calls
    .create({
      url: url,
      to: fullPhoneNumber,
      from: config.sendingNumber
    })
    .then(call => {
      console.log(`Voice call to ${phoneNumber} with id ${call.sid}`)
      return call.sid
    })
}

// the URL that the volunteer can use to join the session on the client
function getSessionUrl(sessionId) {
  const protocol = config.NODE_ENV === 'production' ? 'https' : 'http'
  const sessionIdEncoded = base64url(Buffer.from(sessionId.toString(), 'hex'))
  return `${protocol}://${config.client.host}/s/${sessionIdEncoded}`
}

const notifyRegular = async function(session) {
  const populatedSession = await Session.findById(session._id)
    .populate('student notifications')
    .exec()

  const subtopic = session.subTopic

  // previously sent notifications for this session
  const notificationsSent = populatedSession.notifications

  // currently active sessions
  const activeSessions = await Session.find({
    endedAt: { $exists: false }
  }).exec()

  // previously notified volunteers for this session
  const notifiedUserIds = notificationsSent.map(
    notification => notification.volunteer
  )

  // volunteers in active sessions
  const userIdsInSessions = activeSessions
    .filter(activeSession => !!activeSession.volunteer)
    .map(activeSession => activeSession.volunteer)

  // query the database for the next wave
  const waveVolunteers = await getNextVolunteersFromDb(
    subtopic,
    notifiedUserIds,
    userIdsInSessions,
    {
      isTestUserRequest: populatedSession.student.isTestUser
    }
  ).exec()

  // people to whom to send notifications to
  const volunteersByPriority = waveVolunteers
    .filter(v => v.volunteerPointRank >= 0)
    .sort((v1, v2) => v2.volunteerPointRank - v1.volunteerPointRank)

  const volunteersToNotify = volunteersByPriority.slice(0, 5)

  // notifications to record in the database
  const notifications = []

  // notify the volunteers
  for (const volunteer of volunteersToNotify) {
    // record notification in database
    const notification = new Notification({
      volunteer: volunteer,
      type: 'REGULAR',
      method: 'SMS'
    })

    const name = volunteer.firstname

    const phoneNumber = volunteer.phone

    const isTestUserRequest = session.student.isTestUser

    // format message
    const messageText = `Hi ${name}, a student needs help in ${subtopic} on UPchieve! Respond YES if you're available.`

    const sendPromise = sendTextMessage(
      phoneNumber,
      messageText,
      isTestUserRequest
    )

    try {
      notifications.push(await recordNotification(sendPromise, notification))
    } catch (err) {
      console.log(err)
    }
  }

  // save notifications to Session instance
  await session.addNotifications(notifications)
  return notifications.length
}

const notifyFailsafe = async function(session, options) {
  const populatedSession = await Session.findById(session._id)
    .populate('student notifications')
    .exec()

  const populatedStudent = await User.populate(populatedSession.student, {
    path: 'approvedHighschool'
  })

  var studentFirstname = populatedSession.student.firstname

  var studentHighSchool = populatedStudent.highschoolName

  var isFirstTimeRequester =
    !populatedSession.student.pastSessions ||
    !populatedSession.student.pastSessions.length

  var subtopic = session.subTopic

  var desperate = options.desperate

  var voice = options.voice

  var isTestUserRequest = populatedSession.student.isTestUser

  const volunteerIdsNotified = populatedSession.notifications.map(
    notification => notification.volunteer
  )

  const numOfRegularVolunteersNotified = await User.countDocuments({
    _id: { $in: volunteerIdsNotified },
    isFailsafeVolunteer: false
  }).exec()

  const sessionUrl = getSessionUrl(session._id)

  // query the failsafe volunteers to notify
  const volunteersToNotify = await getFailsafeVolunteersFromDb().exec()

  // notifications to record
  const notifications = []

  for (const volunteer of volunteersToNotify) {
    const phoneNumber = volunteer.phone

    let messageText
    if (desperate) {
      messageText =
        `Request by Student ${studentFirstname} still not filled.\n` +
        `Regular volunteers texted: ${numOfRegularVolunteersNotified}`
    } else {
      messageText =
        `Student: ${studentFirstname}\n` +
        `High School: ${studentHighSchool}\n` +
        `Subject: ${subtopic}\n` +
        `First Ever Request: ${isFirstTimeRequester ? 'Yes' : 'No'}`
    }

    if (!voice) {
      messageText = messageText + `\n${sessionUrl}`
    }

    const sendPromise = voice
      ? sendVoiceMessage(phoneNumber, messageText)
      : sendTextMessage(phoneNumber, messageText, isTestUserRequest)

    // record notification to database
    const notification = new Notification({
      volunteer: volunteer,
      type: 'FAILSAFE',
      method: voice ? 'VOICE' : 'SMS'
    })

    try {
      notifications.push(await recordNotification(sendPromise, notification))
    } catch (err) {
      console.log(err)
    }
  }

  // save notifications to session object
  await session.addNotifications(notifications)
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
function recordNotification(sendPromise, notification) {
  return sendPromise
    .then(sid => {
      // record notification in database
      notification.wasSuccessful = true
      notification.messageId = sid
      return notification
    })
    .catch(err => {
      // record notification failure in database
      console.log(err)
      notification.wasSuccessful = false
      return notification
    })
    .then(notification => {
      return notification.save()
    })
}

/**
 * Helper function that gets the SessionTimeout object corresponding
 * to the given session
 */
function getSessionTimeoutFor(session) {
  if (!(session._id in sessionTimeouts)) {
    sessionTimeouts[session._id] = new SessionTimeout(session._id, [], [])
  }
  return sessionTimeouts[session._id]
}

module.exports = {
  getSessionUrl: function(sessionId) {
    return getSessionUrl(sessionId)
  },

  // get total number of available, non-failsafe volunteers in the database
  // return Promise that resolves to count
  countAvailableVolunteersInDb: function(subtopic, options) {
    return User.countDocuments(
      filterAvailableVolunteers(subtopic, options)
    ).exec()
  },

  // count the number of regular volunteers that have been notified for a session
  // return Promise that resolves to count
  countVolunteersNotified: function(session) {
    return Session.findById(session._id)
      .populate('notifications')
      .exec()
      .then(populatedSession => {
        return populatedSession.notifications
          .map(notification => notification.volunteer)
          .filter(
            (volunteer, index, array) =>
              array.indexOf(volunteer) === index &&
              !volunteer.isFailsafeVolunteer
          ).length
      })
  },

  // Begin notifying non-failsafe volunteers for a session
  beginRegularNotifications: async function(session) {
    // Check that twilio client has been authenticated
    if (!twilioClient) {
      // early exit
      return
    }

    const populatedSession = await Session.findById(session._id)
      .populate('student')
      .exec()

    const isNewStudent = populatedSession.student.pastSessions.length === 0
    const oneMinute = 1000 * 60
    // Set delay time for future notifications by 1 min if the user is a new student
    const delayTime = isNewStudent ? oneMinute : 0

    // Schedule future notification waves (once every 2 mins, starting in 2 mins)
    // These will continue until the session is fulfilled or ended
    const interval = setInterval(
      async session => {
        const numVolunteersNotified = await notifyRegular(session)
        if (numVolunteersNotified === 0) {
          clearInterval(interval)
        }
      },
      120000 + delayTime,
      session
    )
    // store interval in memory
    getSessionTimeoutFor(session).intervals.push(interval)

    // Delay initial wave of notifications by 1 min if new student or
    // send initial wave of notifications (right now)
    if (isNewStudent) {
      const timeoutId = setTimeout(() => {
        notifyRegular(session)
      }, oneMinute)
      getSessionTimeoutFor(session).timeouts.push(timeoutId)
    } else {
      notifyRegular(session)
    }
  },

  // begin notifying failsafe volunteers for a session
  beginFailsafeNotifications: async function(session) {
    // check that client has been authenticated
    if (!twilioClient) {
      // early exit
      return
    }

    // Schedule future failsafe SMS notifications
    // (Happens later unless session is fulfilled or ended)
    const desperateTimeout = setTimeout(
      notifyFailsafe,
      config.desperateSMSTimeout,
      session,
      {
        desperate: true,
        voice: false
      }
    )
    getSessionTimeoutFor(session).timeouts.push(desperateTimeout)

    // Schedule future failsafe phone call notifications
    // (Happens later unless session is fulfilled or ended)
    const desperateVoiceTimeout = setTimeout(
      notifyFailsafe,
      config.desperateVoiceTimeout,
      session,
      {
        desperate: true,
        voice: true
      }
    )
    getSessionTimeoutFor(session).timeouts.push(desperateVoiceTimeout)

    // Send first SMS failsafe notifications (Send right now)
    await notifyFailsafe(session, {
      desperate: false,
      voice: false
    })
  },

  stopNotifications: function(session) {
    const sessionTimeout = getSessionTimeoutFor(session)

    if (!sessionTimeout) {
      // early exit
      return
    }

    // clear all timeouts and intervals
    sessionTimeout.timeouts.forEach(timeout => clearTimeout(timeout))
    sessionTimeout.intervals.forEach(interval => clearInterval(interval))

    // remove them from memory
    delete sessionTimeouts[session._id]
  }
}
