const Session = require('../models/Session')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const TwilioService = require('../services/twilio')
const SessionService = require('../services/SessionService')
const StatsService = require('../services/StatsService')
const Sentry = require('@sentry/node')
const PushTokenService = require('../services/PushTokenService')
const PushToken = require('../models/PushToken')

module.exports = {
  create: async function(options) {
    const user = options.user || {}
    const userId = user._id
    const type = options.type
    const subTopic = options.subTopic

    if (!userId) throw new Error('Cannot create a session without a user id')
    if (user.isVolunteer)
      throw new Error('Volunteers cannot create new sessions')
    if (!type) throw new Error('Must provide a type for a new session')

    const currentSession = await Session.current(userId)
    if (currentSession) throw new Error('Student already has an active session')

    const session = new Session({
      student: userId,
      type: type,
      subTopic: subTopic
    })

    const savedSession = await session.save()

    if (!user.isBanned) {
      TwilioService.beginRegularNotifications(savedSession)
      TwilioService.beginFailsafeNotifications(savedSession)
    }

    return savedSession
  },

  // Currently exposed for Cypress e2e tests
  endAll: async function(user) {
    await Session.update(
      {
        $and: [{ student: user._id }, { endedAt: { $exists: false } }]
      },
      { endedAt: new Date(), endedBy: user._id }
    ).exec()
  },

  // Given a sessionId and userId, join the user to the session and send necessary
  // socket events and notifications
  join: async function(socket, { session, user }) {
    const userAgent = socket.request.headers['user-agent']
    const ipAddress = socket.handshake.address

    if (session.endedAt) {
      SessionService.addFailedJoins({
        userId: user._id,
        sessionId: session._id
      })
      throw new Error('Session has ended')
    }

    if (!user.isVolunteer && !user._id.equals(session.student)) {
      SessionService.addFailedJoins({
        userId: user._id,
        sessionId: session._id
      })
      throw new Error("A student cannot join another student's session")
    }

    if (
      user.isVolunteer &&
      session.volunteer &&
      !user._id.equals(session.volunteer)
    ) {
      SessionService.addFailedJoins({
        userId: user._id,
        sessionId: session._id
      })
      throw new Error('A volunter has already joined the session')
    }

    const isInitialVolunteerJoin = user.isVolunteer && !session.volunteer
    if (isInitialVolunteerJoin) {
      await Session.updateOne(
        { _id: session._id },
        {
          volunteerJoinedAt: new Date(),
          volunteer: user._id
        }
      )
      UserActionCtrl.joinedSession(
        user._id,
        session._id,
        userAgent,
        ipAddress
      ).catch(error => Sentry.captureException(error))

      const pushTokens = await PushToken.find({ user: session.student })
        .lean()
        .exec()
      if (pushTokens && pushTokens.length > 0) {
        const tokens = pushTokens.map(token => token.token)
        PushTokenService.sendVolunteerJoined(session, tokens)
      }
    }

    // After 30 seconds of the this.createdAt, we can assume the user is
    // rejoining the session instead of joining for the first time
    const thirtySecondsElapsed = 1000 * 30
    if (
      !isInitialVolunteerJoin &&
      Date.parse(session.createdAt) + thirtySecondsElapsed < Date.now()
    ) {
      UserActionCtrl.rejoinedSession(
        user._id,
        session._id,
        userAgent,
        ipAddress
      ).catch(error => Sentry.captureException(error))
    }
  },

  // deliver a message
  saveMessage: async function({ sessionId, user, message }) {
    const session = await Session.findById(sessionId).exec()
    if (!session) {
      throw new Error('No session found with that ID!')
    }

    this.verifySessionParticipant(
      session,
      user,
      new Error('Only session participants are allowed to send messages')
    )

    // FIXME this needs studentPartnerOrg / volunteerPartnerOrg for segmentSlugs.
    // it's stored on User model for both student and volunteer, so needs another 1-2 queries...
    const segmentSlugs = []
    StatsService.increment('chat-messages', {}, { segmentSlugs })

    return Session.updateOne(
      {
        _id: sessionId
      },
      { $push: { messages: message } }
    )
  },

  // verify that a user is a session participant
  verifySessionParticipant: function(session, user, error) {
    // all participants in the session
    const sessionParticipants = [session.student, session.volunteer].filter(
      element => !!element
    )

    if (
      sessionParticipants.findIndex(participant =>
        participant._id.equals(user._id)
      ) === -1
    ) {
      throw error
    }
  },

  verifySessionParticipantBySessionId: async function(sessionId, user, error) {
    const session = await Session.findById(sessionId)
    this.verifySessionParticipant(session, user, error)
  }
}
