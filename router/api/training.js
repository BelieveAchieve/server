const TrainingCtrl = require('../../controllers/TrainingCtrl')
const UserAction = require('../../controllers/UserActionCtrl')

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
            ? UserAction.passedQuiz(id, 'MATH', category)
            : UserAction.failedQuiz(id, 'MATH', category)

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
}
