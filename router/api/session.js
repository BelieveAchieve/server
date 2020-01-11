const Session = require('../../models/Session')

var SessionCtrl = require('../../controllers/SessionCtrl')

var SocketService = require('../../services/SocketService')

var ObjectId = require('mongodb').ObjectId

module.exports = function (router, io) {
  // io is now passed to this module so that API events can trigger socket events as needed
  const socketService = SocketService(io)
  const sessionCtrl = SessionCtrl(socketService)

  router.route('/session/new').post(async function (req, res) {
    var data = req.body || {}
    var sessionType = data.sessionType
    var sessionSubTopic = data.sessionSubTopic
    var user = req.user

    try {
      const session = await sessionCtrl.create(
        {
          user: user,
          type: sessionType,
          subTopic: sessionSubTopic
        })
      res.json({ sessionId: session._id })
    } catch (err) {
      res.json({ err: err.toString() })
    }
  })

  router.route('/session/end').post(async function (req, res) {
    var data = req.body || {}
    var sessionId = data.sessionId
    var user = req.user

    try {
      const session = await sessionCtrl.end(
        {
          sessionId: sessionId,
          user: user
        }
      )
      res.json({ sessionId: session._id })
    } catch (err) {
      res.json({ err: err.toString() })
    }
  })

  router.route('/session/check').post(async function (req, res) {
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
          sessionId: session._id,
          whiteboardUrl: session.whiteboardUrl
        })
      }
    } catch (err) {
      res.json({ err: err.toString() })
    }
  })

  router.route('/session/current').post(async function (req, res) {
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
      res.json({ err: err.toString() })
    }
  })
}
