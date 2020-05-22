const twilio = require('twilio')
const moment = require('moment-timezone')
const config = require('../config')
const User = require('../models/User')
const queue = require('./QueueService')
const Session = require('../models/Session')
const Notification = require('../models/Notification')
const twilioClient =
  config.accountSid && config.authToken
    ? twilio(config.accountSid, config.authToken)
    : null
const { FORMAT_INTEGRATED_MATH } = require('../constants')
const isIntegratedMath = require('../utils/is-integrated-math')

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

const getNextVolunteer = async ({ subtopic, priorityFilter = {} }) => {
  const availabilityPath = getCurrentAvailabilityPath()
  const certificationPath = `certifications.${subtopic}.passed`

  const filter = {
    isVolunteer: true,
    [availabilityPath]: true,
    [certificationPath]: true,
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
const getFailsafeVolunteers = async () => {
  return User.find({ isFailsafeVolunteer: true })
    .select({ phone: 1, firstname: 1 })
    .exec()
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
function getSessionUrl(session) {
  const protocol = config.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${config.client.host}/session/${
    session.type
  }/${session.subTopic.toLowerCase()}/${session._id}`
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

const relativeDate = msAgo => {
  return new Date(new Date().getTime() - msAgo).toISOString()
}

const getVolunteersNotifiedSince = async sinceDate => {
  const notifications = await Notification.find({
    sentAt: { $gt: sinceDate }
  })
    .select('volunteer')
    .lean()
    .exec()

  return notifications.map(notif => notif.volunteer)
}

const notifyVolunteer = async session => {
  let subtopic = session.subTopic
  const activeSessionVolunteers = await getActiveSessionVolunteers()
  const notifiedLastFifteenMins = await getVolunteersNotifiedSince(
    relativeDate(15 * 60 * 1000)
  )
  const notifiedLastThreeDays = await getVolunteersNotifiedSince(
    relativeDate(3 * 24 * 60 * 60 * 1000)
  )

  const volunteerPriority = [
    {
      volunteerPartnerOrg: { $exists: true },
      _id: { $nin: activeSessionVolunteers.concat(notifiedLastThreeDays) }
    },
    {
      volunteerPartnerOrg: { $exists: false },
      _id: { $nin: activeSessionVolunteers.concat(notifiedLastThreeDays) }
    },
    {
      volunteerPartnerOrg: { $exists: true },
      _id: { $nin: activeSessionVolunteers.concat(notifiedLastFifteenMins) }
    },
    {
      volunteerPartnerOrg: { $exists: false },
      _id: { $nin: activeSessionVolunteers.concat(notifiedLastFifteenMins) }
    }
  ]

  let volunteer

  for (const priorityFilter of volunteerPriority) {
    volunteer = await getNextVolunteer({
      subtopic,
      priorityFilter
    })

    if (volunteer) break
  }

  if (!volunteer) return null

  // Format integrated math subtopics to capital casing
  if (isIntegratedMath(subtopic)) subtopic = FORMAT_INTEGRATED_MATH[subtopic]
  const sessionUrl = getSessionUrl(session)
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

const notifyFailsafe = async function({ session, voice = false }) {
  const subtopic = session.subTopic
  const sessionUrl = getSessionUrl(session)
  const volunteersToNotify = await getFailsafeVolunteers()
  const { isTestUser } = await User.findOne({ _id: session.student })
    .select('isTestUser')
    .lean()
    .exec()

  const notifications = []

  for (const volunteer of volunteersToNotify) {
    const phoneNumber = volunteer.phone

    let messageText = `UPchieve failsafe alert: new ${subtopic} request`

    if (isTestUser) messageText = '[TEST USER] ' + messageText
    if (!voice) messageText = messageText + `\n${sessionUrl}`

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

  getSessionUrl,

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

  beginFailsafeNotifications: async session => {
    await notifyFailsafe({ session, voice: false })
  }
}
