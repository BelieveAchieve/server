const Session = require('../models/Session')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const TwilioService = require('../services/twilio')
const Sentry = require('@sentry/node')
const StatsService = require('../services/StatsService')
const PushTokenService = require('../services/PushTokenService')
const PushToken = require('../models/PushToken')

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
    join: async function(socket, options) {
      const sessionId = options.sessionId
      const user = options.user
      const userAgent = socket.request.headers['user-agent']
      const ipAddress = socket.handshake.address

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

        socketService.emitSessionChange(session._id)
      } catch (err) {
        // data passed so client knows whether the session has ended or was fulfilled
        socketService.bump(
          socket,
          {
            endedAt: session.endedAt,
            volunteer: session.volunteer || null,
            student: session.student
          },
          err
        )
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

      StatsService.increment('chat-messages')

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
    },

    getFilteredSessions: async function({
      showBannedUsers,
      showTestUsers,
      minSessionLength,
      sessionActivityFrom,
      sessionActivityTo,
      minMessagesSent,
      page
    }) {
      const PER_PAGE = 15
      const pageNum = parseInt(page) || 1
      const skip = (pageNum - 1) * PER_PAGE
      const oneDayInMS = 1000 * 60 * 60 * 24
      const estTimeOffset = 1000 * 60 * 60 * 4

      // Add a day to the sessionActivityTo to make it inclusive for the activity range: [sessionActivityFrom, sessionActivityTo]
      const inclusiveSessionActivityTo =
        new Date(sessionActivityTo).getTime() + oneDayInMS

      try {
        const sessions = await Session.aggregate([
          {
            $addFields: {
              // Add the length of a session on the session documents
              sessionLength: {
                $cond: {
                  if: { $ifNull: ['$endedAt', undefined] },
                  then: { $subtract: ['$endedAt', '$createdAt'] },
                  // $$NOW is a mongodb system variable which returns the current time
                  else: { $subtract: ['$$NOW', '$createdAt'] }
                }
              },
              createdAtEstTime: {
                $subtract: ['$createdAt', estTimeOffset]
              }
            }
          },
          {
            $match: {
              // Filter by the length of a session
              sessionLength: { $gte: parseInt(minSessionLength) * 60000 }, // convert mins to milliseconds
              // Filter by a specific date range the sessions took place
              createdAtEstTime: {
                $gte: new Date(sessionActivityFrom),
                $lte: new Date(inclusiveSessionActivityTo)
              },
              // Filter a session by the amount of messages sent
              $expr: {
                $gte: [{ $size: '$messages' }, parseInt(minMessagesSent)]
              }
            }
          },
          {
            // Populate the student on the session document
            $lookup: {
              from: 'users',
              // reference student on the session document and store the id as studentId
              let: { studentId: '$student' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      // Match a student _id to the studentId
                      $eq: ['$_id', '$$studentId']
                    },
                    isBanned: showBannedUsers ? { $in: [true, false] } : false,
                    isTestUser: showTestUsers ? { $in: [true, false] } : false
                  }
                }
              ],
              as: 'student'
            }
          },
          {
            $unwind: '$student'
          },
          {
            $project: {
              createdAt: 1,
              endedAt: 1,
              volunteer: 1,
              messages: 1,
              notifications: 1,
              type: 1,
              subTopic: 1
            }
          }
        ])
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(PER_PAGE)
          .exec()

        const isLastPage = sessions.length < PER_PAGE

        return { sessions, isLastPage }
      } catch (err) {
        throw new Error(err.message)
      }
    }
  }
}
