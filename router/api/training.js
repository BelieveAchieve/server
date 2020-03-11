const TrainingCtrl = require('../../controllers/TrainingCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const Sentry = require('@sentry/node')

module.exports = function(router) {
  router.post('/training/questions', async function(req, res, next) {
    try {
      const questions = await TrainingCtrl.getQuestions({ category: req.body.category })
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
      const data = await TrainingCtrl.getQuizScore({
        userid: req.user._id,
        idAnswerMap: req.body.idAnswerMap,
        category: req.body.category
      })

			const { id } = req.user
      const { category } = req.body

      data.passed
        ? UserActionCtrl.passedQuiz(id, category).catch(error =>
            Sentry.captureException(error)
          )
        : UserActionCtrl.failedQuiz(id, category).catch(error =>
            Sentry.captureException(error)
          )

      res.json({
        msg: 'Score calculated and saved',
        tries: data.tries,
        passed: data.passed,
        score: data.score,
        idCorrectAnswerMap: data.idCorrectAnswerMap
      })
    } catch (err) {
      next(err)
    }
  })
  router.get('/training/review/:category', function(req, res, next) {
    const { id } = req.user
    const { category } = req.params

    UserActionCtrl.viewedMaterials(id, category).catch(error =>
      Sentry.captureException(error)
    )

    res.sendStatus(204)
  })
}
