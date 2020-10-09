const Session = require('../models/Session')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const TwilioService = require('../services/twilio')
const Sentry = require('@sentry/node')
const PushTokenService = require('../services/PushTokenService')
const PushToken = require('../models/PushToken')
const { USER_ACTION } = require('../constants')

module.exports = function(socketService) {
  return {
    create: async function(options) {
      const user = options.user || {}
      const userId = user._id
      const type = options.type
      const subTopic = options.subTopic
      const currentSession = await Session.current(userId)

      if (!userId) {
        throw new Error('Cannot create a session without a user id')
      } else if (user.isVolunteer) {
        throw new Error('Volunteers cannot create new sessions')
      } else if (!type) {
        throw new Error('Must provide a type for a new session')
      } else if (currentSession) {
        throw new Error('Student already has an active session')
      }

      const session = new Session({
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

      if (user.isVolunteer && !user.isApproved) {
        throw new Error('Volunteer not approved')
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
      studentRating,
      volunteerRating,
      firstTimeStudent,
      firstTimeVolunteer,
      isReported,
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

      const sessionQueryFilter = {
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

      if (Number(studentRating))
        sessionQueryFilter.studentRating = Number(studentRating)
      if (Number(volunteerRating))
        sessionQueryFilter.volunteerRating = Number(volunteerRating)
      if (isReported) sessionQueryFilter.isReported = true

      const userQueryFilter = {
        showSession: true,
        'student.isTestUser': showTestUsers ? { $in: [true, false] } : false
      }

      if (firstTimeStudent && firstTimeVolunteer) {
        userQueryFilter.$or = [
          { 'student.pastSessions': { $size: 1 } },
          { 'volunteer.pastSessions': { $size: 1 } }
        ]
      } else if (firstTimeStudent) {
        userQueryFilter['student.pastSessions'] = { $size: 1 }
      } else if (firstTimeVolunteer) {
        userQueryFilter['volunteer.pastSessions'] = { $size: 1 }
      }

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
            $lookup: {
              from: 'feedbacks',
              localField: '_id',
              foreignField: 'sessionId',
              as: 'feedbacks'
            }
          },
          // add student and volunteer feedback if present
          {
            $addFields: {
              studentFeedback: {
                $filter: {
                  input: '$feedbacks',
                  as: 'feedback',
                  cond: { $eq: ['$$feedback.userType', 'student'] }
                }
              },
              volunteerFeedback: {
                $filter: {
                  input: '$feedbacks',
                  as: 'feedback',
                  cond: { $eq: ['$$feedback.userType', 'volunteer'] }
                }
              }
            }
          },
          {
            $unwind: {
              path: '$studentFeedback',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: '$volunteerFeedback',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $addFields: {
              studentRating: {
                $cond: {
                  if: '$studentFeedback.responseData.rate-session.rating',
                  then: '$studentFeedback.responseData.rate-session.rating',
                  else: null
                }
              },
              volunteerRating: {
                $cond: {
                  if: '$volunteerFeedback.responseData.rate-session.rating',
                  then: '$volunteerFeedback.responseData.rate-session.rating',
                  else: null
                }
              }
            }
          },
          {
            $match: sessionQueryFilter
          },
          {
            $lookup: {
              from: 'users',
              localField: 'student',
              foreignField: '_id',
              as: 'student'
            }
          },
          {
            $unwind: '$student'
          },
          {
            $lookup: {
              from: 'users',
              localField: 'volunteer',
              foreignField: '_id',
              as: 'volunteer'
            }
          },
          {
            $unwind: {
              path: '$volunteer',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'useractions',
              let: { userId: '$student._id' },
              pipeline: [
                // Get user actions with 'BANNED' per session
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$action', USER_ACTION.ACCOUNT.BANNED] }
                      ]
                    }
                  }
                }
              ],
              as: 'bannedUserAction'
            }
          },
          {
            $addFields: {
              // Retrieve the most recent 'BANNED' user action
              lastBannedAt: { $max: '$bannedUserAction.createdAt' }
            }
          },
          {
            // Show sessions that were created before a user has been banned
            // If showBannedUsers is true, show all sessions up to chosen date
            $addFields: {
              showSession: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$lastBannedAt', undefined] },
                      { $eq: ['$student.isBanned', false] }
                    ]
                  },
                  then: true,
                  else: {
                    $cond: [
                      {
                        $lte: [
                          '$createdAtEstTime',
                          showBannedUsers
                            ? new Date(inclusiveSessionActivityTo)
                            : '$lastBannedAt'
                        ]
                      },
                      true,
                      false
                    ]
                  }
                }
              }
            }
          },
          {
            $match: userQueryFilter
          },
          {
            $project: {
              createdAt: 1,
              endedAt: 1,
              volunteer: 1,
              messages: 1,
              notifications: 1,
              type: 1,
              subTopic: 1,
              studentFirstName: '$student.firstname',
              studentRating: 1
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
