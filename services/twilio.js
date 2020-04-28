const config = require('../config.js')
const User = require('../models/User')
const twilio = require('twilio')
const queue = require('./QueueService')
const moment = require('moment-timezone')
const twilioClient =
  config.accountSid && config.authToken
    ? twilio(config.accountSid, config.authToken)
    : null
const base64url = require('base64url')

const Session = require('../models/Session')
const Notification = require('../models/Notification')

// get the availability field to query for the current time
function getCurrentAvailabilityPath() {
  const dateString = new Date().toUTCString()
  const date = moment.utc(dateString).tz('America/New_York')
  const day = date.isoWeekday() - 1
  let hour = date.hour()

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

  const days = [
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

const getNextVolunteer = async ({
  subtopic,
  volunteersToExclude = [],
  priorityFilter = {}
}) => {
  const availability = getCurrentAvailabilityPath()
  const certificationPassed = `certifications.${subtopic}.passed`

  const filter = {
    _id: { $nin: volunteersToExclude },
    isVolunteer: true,
    [certificationPassed]: true,
    [availability]: true,
    phone: { $exists: true },
    isTestUser: false,
    isFakeUser: false,
    isFailsafeVolunteer: false,
    ...priorityFilter
  }

  const query = User.aggregate([
    { $match: filter },
    { $project: { phone: 1, firstname: 1 } },
    { $sample: { size: 1 } }
  ])

  const volunteers = await query.exec()
  return volunteers[0]
}

// query failsafe volunteers to notify
const getFailsafeVolunteersFromDb = function() {
  const userQuery = {
    isFailsafeVolunteer: true
  }
  return User.find(userQuery).select({ phone: 1, firstname: 1 })
}

function sendTextMessage(phoneNumber, messageText) {
  console.log(`Sending text message "${messageText}" to ${phoneNumber}`)

  // If stored phone number doesn't have international calling code (E.164 formatting)
  // then default to US number
  // @todo: normalize previously stored US phone numbers
  const fullPhoneNumber =
    phoneNumber[0] === '+' ? phoneNumber : `+1${phoneNumber}`

  if (!twilioClient) {
    console.log('Twilio client not loaded.')
    return Promise.resolve()
  }
  return twilioClient.messages
    .create({
      to: fullPhoneNumber,
      from: config.sendingNumber,
      body: messageText
    })
    .then(message => {
      console.log(
        `Message sent to ${phoneNumber} with message id \n` + message.sid
      )
      return message.sid
    })
}

function sendVoiceMessage(phoneNumber, messageText) {
  console.log(`Sending voice message "${messageText}" to ${phoneNumber}`)

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
  if (!twilioClient) {
    console.log('Twilio client not loaded.')
    return Promise.resolve()
  }
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

const getActiveSessionVolunteers = async () => {
  const activeSessions = await Session.find({
    endedAt: { $exists: false },
    volunteer: { $exists: true }
  })
    .select('volunteer')
    .lean()
    .exec()

  return activeSessions.map(session => session.volunteer)
}

const getRecentlyNotifiedVolunteers = async () => {
  const fifteenMinsAgo = new Date(
    new Date().getTime() - 15 * 60 * 1000
  ).toISOString()

  const recentNotifications = await Notification.find({
    sentAt: { $gt: fifteenMinsAgo }
  })
    .select('volunteer')
    .lean()
    .exec()

  return recentNotifications.map(notif => notif.volunteer)
}

const notifyVolunteer = async function(session) {
  const subtopic = session.subTopic
  const recentlyNotifiedVolunteers = await getRecentlyNotifiedVolunteers()
  const activeSessionVolunteers = await getActiveSessionVolunteers()
  const volunteersToExclude = activeSessionVolunteers.concat(
    recentlyNotifiedVolunteers
  )

  const volunteerPriority = [
    { volunteerPartnerOrg: { $exists: true } },
    { volunteerPartnerOrg: { $exists: false } }
  ]

  let volunteer

  for (const priorityFilter of volunteerPriority) {
    volunteer = await getNextVolunteer({
      subtopic: session.subTopic,
      volunteersToExclude,
      priorityFilter
    })

    if (volunteer) break
  }

  if (!volunteer) return null

  const sessionUrl = getSessionUrl(session._id)
  const messageText = `Hi ${volunteer.firstname}, a student needs help in ${subtopic} on UPchieve! ${sessionUrl}`
  const sendPromise = sendTextMessage(volunteer.phone, messageText)

  const notification = new Notification({
    volunteer,
    type: 'REGULAR',
    method: 'SMS'
  })

  await recordNotification(sendPromise, notification)
  await session.addNotifications([notification])

  return volunteer
}

const notifyFailsafe = async function(session, options) {
  const subtopic = session.subTopic
  const voice = options.voice
  const sessionUrl = getSessionUrl(session._id)

  // query the failsafe volunteers to notify
  const volunteersToNotify = await getFailsafeVolunteersFromDb().exec()

  // notifications to record
  const notifications = []

  for (const volunteer of volunteersToNotify) {
    const phoneNumber = volunteer.phone

    let messageText = `UPchieve failsafe alert: new ${subtopic} request`

    if (!voice) {
      messageText = messageText + `\n${sessionUrl}`
    }

    const sendPromise = voice
      ? sendVoiceMessage(phoneNumber, messageText)
      : sendTextMessage(phoneNumber, messageText)

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

module.exports = {
  notifyVolunteer,

  getSessionUrl: function(sessionId) {
    return getSessionUrl(sessionId)
  },

  // Begin notifying non-failsafe volunteers for a session
  beginRegularNotifications: async function(session) {
    const student = await User.findOne({ _id: session.student })
      .lean()
      .exec()

    if (student.isTestUser) return

    const isNewStudent = !student.pastSessions || !student.pastSessions.length

    // Delay initial wave of notifications by 1 min if new student or
    // send initial wave of notifications (right now)
    const notificationSchedule = config.notificationSchedule.slice()
    if (isNewStudent) notificationSchedule.unshift(1000 * 60)
    else notifyVolunteer(session)
    const delay = notificationSchedule.shift()
    queue.add(
      'NotifyTutors',
      { sessionId: session._id, notificationSchedule },
      { delay }
    )
  },

  // begin notifying failsafe volunteers for a session
  beginFailsafeNotifications: async function(session) {
    // Send first SMS failsafe notifications (Send right now)
    notifyFailsafe(session, {
      desperate: false,
      voice: false
    })
  }
}
