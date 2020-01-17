var TrainingCtrl = require('../../controllers/TrainingCtrl')

module.exports = function (router) {
  router.post('/training/questions', function (req, res, next) {
    TrainingCtrl.getQuestions({ category: req.body.category }, function (
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
  router.post('/training/score', function (req, res, next) {
    TrainingCtrl.getQuizScore(
      {
        userid: req.user._id,
        idAnswerMap: req.body.idAnswerMap,
        category: req.body.category
      },
      function (err, data) {
        if (err) {
          next(err)
        } else {
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
