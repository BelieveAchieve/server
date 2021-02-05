import * as FeedbackService from '../../services/FeedbackService'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = function(router) {
  router.post('/feedback', async (req, res, next) => {
    const {
      sessionId,
      topic,
      subTopic,
      responseData,
      userType,
      studentId,
      volunteerId
    } = req.body
    try {
      const feedback = await FeedbackService.saveFeedback({
        sessionId,
        type: topic,
        subTopic,
        responseData,
        userType,
        studentId,
        volunteerId
      })
      res.json({
        feedback: feedback._id
      })
    } catch (error) {
      next(error)
    }
  })

  router.get('/feedback', async (req, res, next) => {
    const { sessionId, userType } = req.query
    try {
      const feedback = await FeedbackService.getFeedback({
        sessionId,
        userType
      })

      res.json({
        feedback: feedback ? feedback._id : null
      })
    } catch (error) {
      next(error)
    }
  })
}
