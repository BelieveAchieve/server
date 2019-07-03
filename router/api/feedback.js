var Feedback = require('../../models/Feedback')

module.exports = function (router) {
  router.post('/feedback', function (req, res) {
    var body = req.body
    var feedback = new Feedback({
      sessionId: body['sessionId'],
      type: body['topic'],
      subTopic: body['subTopic'],
      responseData: body['responseData'],
      userType: body['userType'],
      studentId: body['studentId'],
      volunteerId: body['volunteerId']
    })
    console.log(feedback)
    feedback.save(function (err, session) {
      if (err) {
        console.log(err)
        res.json({
          err: err
        })
      } else {
        res.json({
          sessionId: session._id
        })
      }
    })
  })
}
