const ObjectId = require('mongodb').ObjectId
const Sentry = require('@sentry/node')
const Session = require('../../models/Session')
const SessionCtrl = require('../../controllers/SessionCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const SocketService = require('../../services/SocketService')
const recordIpAddress = require('../../middleware/record-ip-address')
const passport = require('../auth/passport')

module.exports = function(router, io) {
  // io is now passed to this module so that API events can trigger socket events as needed
  const socketService = SocketService(io)
  const sessionCtrl = SessionCtrl(socketService)

  router
    .route('/session/new')
    .post(recordIpAddress, async function(req, res, next) {
      const data = req.body || {}
      const sessionType = data.sessionType
      const sessionSubTopic = data.sessionSubTopic
      const { user, ip } = req

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

  router.get('/sessions', passport.isAdmin, async function(req, res, next) {
    const PER_PAGE = 15
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * PER_PAGE

    try {
      const sessions = await Session.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PER_PAGE)
        .lean()
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

      res.json({ session })
    } catch (err) {
      console.log(err)
      next(err)
    }
  })
}
