const Feedback = require('../../models/Feedback')
const StatsService = require('../../services/StatsService')

module.exports = function(router) {
  router.post('/feedback', function(req, res, next) {
    const body = req.body
    const feedback = new Feedback({
      sessionId: body['sessionId'],
      type: body['topic'],
      subTopic: body['subTopic'],
      responseData: body['responseData'],
      userType: body['userType'],
      studentId: body['studentId'],
      volunteerId: body['volunteerId']
    })

    const rating =
      feedback.responseData &&
      feedback.responseData['rate-session'] &&
      feedback.responseData['rate-session'].rating
    if (rating) {
      const dimensions = {
        topic: feedback.topic,
        'sub-topic': feedback.subTopic
      }
      StatsService.increment('session-rating', dimensions, rating)
      StatsService.increment('session-ratings', dimensions)
    }

    feedback.save(function(err, session) {
      if (err) {
        next(err)
      } else {
        res.json({
          sessionId: session._id
        })
      }
    })
  })
}
