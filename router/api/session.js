var SessionCtrl = require('../../controllers/SessionCtrl')

var ObjectId = require('mongodb').ObjectId

module.exports = function (router) {
  router.route('/session/new').post(function (req, res) {
    var data = req.body || {}
    var sessionType = data.sessionType
    var sessionSubTopic = data.sessionSubTopic
    var user = req.user

    SessionCtrl.create(
      {
        user: user,
        type: sessionType,
        subTopic: sessionSubTopic
      },
      function (err, session) {
        if (err) {
          res.json({
            err: err
          })
        } else {
          res.json({
            sessionId: session._id
          })
        }
      }
    )
  })

  router.route('/session/end').post(function (req, res) {
    var data = req.body || {}
    var sessionId = data.sessionId
    var user = req.user
    SessionCtrl.end(
      {
        sessionId: sessionId,
        user: user
      },
      function (err, session) {
        if (err) {
          res.json({ err: err })
        } else {
          res.json({ sessionId: session._id })
        }
      }
    )
  })

  router.route('/session/check').post(function (req, res) {
    var data = req.body || {}
    var sessionId = data.sessionId

    SessionCtrl.get(
      {
        sessionId: sessionId
      },
      function (err, session) {
        if (err) {
          res.json({
            err: err
          })
        } else if (!session) {
          res.json({
            err: 'No session found'
          })
        } else {
          res.json({
            sessionId: session._id,
            whiteboardUrl: session.whiteboardUrl
          })
        }
      }
    )
  })

  router.route('/session/current').post(function (req, res) {
    const data = req.body || {}
    const userId = ObjectId(data.user_id)

    SessionCtrl.findLatest(
      {
        $and: [
          { endedAt: { $exists: false } },
          {
            $or: [{ student: userId }, { volunteer: userId }]
          }
        ]
      },
      function (err, session) {
        if (err) {
          res.json({ err: err })
        } else if (!session) {
          res.json({ err: 'No session found' })
        } else {
          res.json({
            sessionId: session._id,
            data: session
          })
        }
      }
    )
  })
}
