const ObjectId = require('mongodb').ObjectId
const Sentry = require('@sentry/node')
const Session = require('../../models/Session')
const Feedback = require('../../models/Feedback')
const SessionCtrl = require('../../controllers/SessionCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const SocketService = require('../../services/SocketService')
const SessionService = require('../../services/SessionService')
const UserService = require('../../services/UserService')
const MailService = require('../../services/MailService')
const recordIpAddress = require('../../middleware/record-ip-address')
const passport = require('../auth/passport')
const mapMultiWordSubtopic = require('../../utils/map-multi-word-subtopic')
const { USER_BAN_REASON } = require('../../constants')

module.exports = function(router, io) {
  // io is now passed to this module so that API events can trigger socket events as needed
  const socketService = SocketService(io)
  const sessionCtrl = SessionCtrl(socketService)

  router
    .route('/session/new')
    .post(recordIpAddress, async function(req, res, next) {
      const data = req.body || {}
      const sessionType = data.sessionType
      let sessionSubTopic = data.sessionSubTopic
      const { user, ip } = req

      // Map multi-word categories from lowercased to how it's defined in the User model
      // ex: 'physicsone' -> 'physicsOne' and stores 'physicsOne' on the session
      sessionSubTopic = mapMultiWordSubtopic(sessionSubTopic)

      try {
        const session = await sessionCtrl.create({
          user,
          type: sessionType,
          subTopic: sessionSubTopic
        })

        const userAgent = req.get('User-Agent')

        UserActionCtrl.requestedSession(
          user._id,
          session._id,
          userAgent,
          ip
        ).catch(error => Sentry.captureException(error))

        res.json({ sessionId: session._id })
      } catch (err) {
        next(err)
      }
    })

  router.route('/session/end').post(async function(req, res, next) {
    const data = req.body || {}
    const sessionId = data.sessionId
    const user = req.user
    const userAgent = req.get('User-Agent')
    const ipAddress = req.ip

    try {
      const session = await sessionCtrl.end({
        sessionId: sessionId,
        user: user
      })
      UserActionCtrl.endedSession(
        user._id,
        session._id,
        userAgent,
        ipAddress
      ).catch(error => {
        Sentry.captureException(error)
      })
      res.json({ sessionId: session._id })
    } catch (err) {
      next(err)
    }
  })

  // Basic route exposed for Cypress to end all of a student's sessions
  router.route('/session/end-all').post(async function(req, res, next) {
    const user = req.user

    try {
      await sessionCtrl.endAll(user)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  })

  router.route('/session/check').post(async function(req, res, next) {
    const data = req.body || {}
    const sessionId = data.sessionId

    try {
      const session = await Session.findById(sessionId).exec()

      if (!session) {
        res.status(404).json({
          err: 'No session found'
        })
      } else {
        res.json({
          sessionId: session._id
        })
      }
    } catch (err) {
      next(err)
    }
  })

  router.route('/session/current').post(async function(req, res, next) {
    const data = req.body || {}
    const userId = ObjectId(data.user_id)

    try {
      const currentSession = await Session.current(userId)
      if (!currentSession) {
        res.status(404).json({ err: 'No current session' })
      } else {
        res.json({
          sessionId: currentSession._id,
          data: currentSession
        })
      }
    } catch (err) {
      next(err)
    }
  })

  router.route('/session/latest').post(async function(req, res, next) {
    const data = req.body || {}
    const userId = ObjectId(data.user_id)

    try {
      const latestSession = await Session.findOne({ student: userId })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean()

      if (!latestSession) {
        res.status(404).json({ err: 'No latest session' })
      } else {
        res.json({
          sessionId: latestSession._id,
          data: latestSession
        })
      }
    } catch (err) {
      next(err)
    }
  })

  router.post('/session/:sessionId/report', async function(req, res) {
    const { sessionId } = req.params
    const { reportMessage } = req.body
    const { user } = req
    const session = await SessionService.getSession(sessionId)

    if (!session || !session.volunteer || !session.volunteer === user._id)
      return res.status(401).json({ err: 'Unable to report this session' })

    await UserService.banUser({
      userId: session.student,
      banReason: USER_BAN_REASON.SESSION_REPORTED
    })

    MailService.sendReportedSessionAlert({
      sessionId,
      reportedByEmail: user.email,
      reportMessage: reportMessage || '(no message)'
    })

    return res.json({ msg: 'Success' })
  })

  router.get('/sessions', passport.isAdmin, async function(req, res, next) {
    const PER_PAGE = 15
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * PER_PAGE
    const {
      showBannedUsers,
      showTestUsers,
      minSessionLength,
      sessionActivityFrom,
      sessionActivityTo,
      minMessagesSent
    } = req.query

    // Add a day to the sessionActivityTo to make it inclusive for the activity range: [sessionActivityFrom, sessionActivityTo]
    const inclusiveSessionActivityTo =
      new Date(sessionActivityTo).getTime() + 1000 * 60 * 60 * 24

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
            }
          }
        },
        {
          $match: {
            // Filter by the length of a session
            sessionLength: { $gte: parseInt(minSessionLength) * 60000 }, // convert mins to milliseconds
            // Filter by a specific date range the sessions took place
            createdAt: {
              $gte: new Date(sessionActivityFrom),
              $lte: new Date(inclusiveSessionActivityTo)
            },
            // Filter a session by the amount of messages sent
            $expr: { $gte: [{ $size: '$messages' }, parseInt(minMessagesSent)] }
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
        }
      ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PER_PAGE)
        .exec()

      const isLastPage = sessions.length < PER_PAGE

      res.json({ sessions, isLastPage })
    } catch (err) {
      console.log(err)
      next(err)
    }
  })

  router.get('/session/:sessionId', passport.isAdmin, async function(
    req,
    res,
    next
  ) {
    const { sessionId } = req.params

    try {
      const session = await Session.findOne({ _id: sessionId })
        .populate('student volunteer')
        .lean()
        .exec()

      session.feedbacks = await Feedback.find({ sessionId })

      res.json({ session })
    } catch (err) {
      console.log(err)
      next(err)
    }
  })
}
