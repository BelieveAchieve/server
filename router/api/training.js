var TrainingCtrl = require('../../controllers/TrainingCtrl')

module.exports = function (router) {
  router.post('/training/questions', async function (req, res) {
    try {
      const questions = await TrainingCtrl.getQuestions({ category: req.body.category })
      res.json({
        msg: 'Questions retrieved from database',
        questions: questions
      })
    } catch (err) {
      res.json({ err: err })
    }
  })
  router.post('/training/score', async function (req, res) {
    try {
      const data = await TrainingCtrl.getQuizScore({
        userid: req.body.userid,
        idAnswerMap: req.body.idAnswerMap,
        category: req.body.category
      })
      
      res.json({
        msg: 'Score calculated and saved',
        tries: data.tries,
        passed: data.passed,
        score: data.score,
        idCorrectAnswerMap: data.idCorrectAnswerMap
      })
    } catch (err) {
      res.json({ err: err })
    }
  })
}
