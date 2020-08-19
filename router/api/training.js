const Sentry = require('@sentry/node')
const TrainingCtrl = require('../../controllers/TrainingCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const TrainingCourseService = require('../../services/TrainingCourseService')

module.exports = function(router) {
  router.post('/training/questions', async function(req, res, next) {
    try {
      const questions = await TrainingCtrl.getQuestions({
        category: req.body.category
      })
      res.json({
        msg: 'Questions retrieved from database',
        questions: questions
      })
    } catch (err) {
      next(err)
    }
  })

  router.post('/training/score', async function(req, res, next) {
    try {
      const { user, ip } = req
      const { category, idAnswerMap } = req.body

      const {
        tries,
        passed,
        score,
        idCorrectAnswerMap
      } = await TrainingCtrl.getQuizScore({
        user,
        idAnswerMap,
        category,
        ip
      })

      passed
        ? UserActionCtrl.passedQuiz(user._id, category, ip).catch(error =>
            Sentry.captureException(error)
          )
        : UserActionCtrl.failedQuiz(user._id, category, ip).catch(error =>
            Sentry.captureException(error)
          )

      res.json({
        msg: 'Score calculated and saved',
        tries,
        passed,
        score,
        idCorrectAnswerMap
      })
    } catch (err) {
      next(err)
    }
  })

  router.get('/training/review/:category', function(req, res, next) {
    const { _id } = req.user
    const { category } = req.params
    const { ip: ipAddress } = req

    UserActionCtrl.viewedMaterials(_id, category, ipAddress).catch(error =>
      Sentry.captureException(error)
    )

    res.sendStatus(204)
  })

  router.get('/training/course/:courseKey', function(req, res, next) {
    const { user } = req
    const { courseKey } = req.params
    const course = TrainingCourseService.getCourse(user, courseKey)
    if (!course) return res.sendStatus(404)
    res.status(200).json({ course })
  })

  router.post('/training/course/:courseKey/progress', async function(
    req,
    res,
    next
  ) {
    const { user } = req
    const { courseKey } = req.params
    const { materialKey } = req.body
    const { progress, isComplete } = await TrainingCourseService.recordProgress(
      user,
      courseKey,
      materialKey
    )
    res.status(200).json({ progress, isComplete })
  })
}
