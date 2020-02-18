const Session = require('../models/Session')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const sessionService = require('../services/SessionService')
const twilioService = require('../services/twilio')
const Sentry = require('@sentry/node')

module.exports = function(socketService) {
  return {
    create: async function(options) {
      var user = options.user || {}
      var userId = user._id
      var type = options.type
      var subTopic = options.subTopic

      if (!userId) {
        throw new Error('Cannot create a session without a user id')
      } else if (user.isVolunteer) {
        throw new Error('Volunteers cannot create new sessions')
      } else if (!type) {
        throw new Error('Must provide a type for a new session')
      }

      var session = new Session({
        student: userId,
        type: type,
        subTopic: subTopic
      })

      const savedSession = await session.save()

      socketService.emitNewSession(savedSession)

      twilioService.beginRegularNotifications(savedSession).then(() => {
        twilioService.beginFailsafeNotifications(savedSession)
      })

      return savedSession
    },

    end: async function(options) {
      const user = options.user

      if (!options.sessionId) {
        throw new Error('No session ID specified')
      }

      const session = await Session.findById(options.sessionId).exec()

      if (!session) {
        throw new Error('No session found')
      }

      if (session.endedAt) {
        // Session has already ended (the other user ended it)
        return session
      }

      this.verifySessionParticipant(
        session,
        user,
        new Error('Only session participants can end a session')
      )

      await sessionService.endSession(session, user)

      socketService.emitSessionEnd(options.sessionId)

      twilioService.stopNotifications(session)

      return session
    },

    // Given a sessionId and userId, join the user to the session and send necessary
    // socket events and notifications
    join: async function(socket, options) {
      const sessionId = options.sessionId
      const user = options.user
      const userAgent = socket.request.headers['user-agent']

      if (!user) {
        throw new Error('User not authenticated')
      }

      const session = await Session.findById(sessionId).exec()
      if (!session) {
        throw new Error('No session found!')
      }

      try {
        const isInitialVolunteerJoin = user.isVolunteer && !session.volunteer

        await session.joinUser(user)

        if (isInitialVolunteerJoin) {
          UserActionCtrl.joinedSession(
            user._id,
            session._id,
            userAgent
          ).catch(error => Sentry.captureException(error))
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
            userAgent
          ).catch(error => Sentry.captureException(error))
        }

        socketService.joinUserToSession(sessionId, user._id, socket)

        if (user.isVolunteer) {
          twilioService.stopNotifications(session)
        }
      } catch (err) {
        // data passed so client knows whether the session has ended or was fulfilled
        socketService.bump(socket, { endedAt: session.endedAt }, err)
      }
    },

    // deliver a message
    message: async function(data) {
      const message = {
        user: data.user,
        contents: data.message
      }
      const sessionId = data.sessionId

      const session = await Session.findById(sessionId).exec()
      if (!session) {
        throw new Error('No session found with that ID!')
      }

      this.verifySessionParticipant(
        session,
        data.user,
        new Error('Only session participants are allowed to send messages')
      )

      const savedMessage = await session.saveMessage(message)

      socketService.deliverMessage(savedMessage, sessionId)
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

    verifySessionParticipantBySessionId: async function(
      sessionId,
      user,
      error
    ) {
      const session = await Session.findById(sessionId)
      this.verifySessionParticipant(session, user, error)
    }
  }
}
