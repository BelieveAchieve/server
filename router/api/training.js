const TrainingCtrl = require('../../controllers/TrainingCtrl')
const UserActionCtrl = require('../../controllers/UserActionCtrl')

module.exports = function(router) {
  router.post('/training/questions', function(req, res, next) {
    TrainingCtrl.getQuestions({ category: req.body.category }, function(
      err,
      questions
    ) {
      if (err) {
        next(err)
      } else {
        res.json({
          msg: 'Questions retrieved from database',
          questions: questions
        })
      }
    })
  })
  router.post('/training/score', function(req, res, next) {
    TrainingCtrl.getQuizScore(
      {
        userid: req.user._id,
        idAnswerMap: req.body.idAnswerMap,
        category: req.body.category
      },
      function(err, data) {
        if (err) {
          next(err)
        } else {
          const { id } = req.user
          const { category } = req.body

          data.passed
            ? UserActionCtrl.passedQuiz(id, category)
            : UserActionCtrl.failedQuiz(id, category)

          res.json({
            msg: 'Score calculated and saved',
            tries: data.tries,
            passed: data.passed,
            score: data.score,
            idCorrectAnswerMap: data.idCorrectAnswerMap
          })
        }
      }
    )
  })
  router.get('/training/review/:category', async function(req, res, next) {
    const { id } = req.user
    const { category } = req.params

    try {
      await UserActionCtrl.viewedMaterials(id, category)
    } catch (error) {
      console.error(error)
    }

    res.sendStatus(204)
  })
}
