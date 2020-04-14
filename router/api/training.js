const TrainingCtrl = require('../../controllers/TrainingCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const Sentry = require('@sentry/node')

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
      const { user } = req
      const { category, idAnswerMap } = req.body

      const {
        tries,
        passed,
        score,
        idCorrectAnswerMap
      } = await TrainingCtrl.getQuizScore({
        user,
        idAnswerMap,
        category
      })

      passed
        ? UserActionCtrl.passedQuiz(user.id, category).catch(error =>
            Sentry.captureException(error)
          )
        : UserActionCtrl.failedQuiz(user.id, category).catch(error =>
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
    const { id } = req.user
    const { category } = req.params

    UserActionCtrl.viewedMaterials(id, category).catch(error =>
      Sentry.captureException(error)
    )

    res.sendStatus(204)
  })
}
