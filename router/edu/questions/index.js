const path = require('path')

const ejs = require('ejs')

const QuestionCtrl = require('../../../controllers/QuestionCtrl')

module.exports = router => {
  router.route('/questions').get(async (req, res) => {
    const templateFile = path.join(path.resolve(__dirname), 'index.html.ejs')
    let questions = []

    try {
      const filters = req.query || {}
      questions = await QuestionCtrl.list(filters)

      ejs.renderFile(templateFile, { questions }, null, (err, str) => {
        if (err) {
          res.send('404 Not Found')
        }

        res.send(str)
      })
    } catch (_error) {
      res.send('500 Internal Server Error')
    }
  })

  router.route('/questions/new').get((req, res) => {
    const templateFile = path.join(path.resolve(__dirname), 'new.html.ejs')
    const questions = [
      {
        possibleAnswers: [
          { val: 'a' },
          { val: 'b' },
          { val: 'c' },
          { val: 'd' }
        ]
      }
    ]

    ejs.renderFile(templateFile, { questions }, null, (err, str) => {
      if (err) {
        res.send('404 Not Found')
      }

      res.send(str)
    })
  })

  router.route('/questions').post(async (req, res) => {
    try {
      const question = await QuestionCtrl.create(req.body.question)
      res.status(200).json({ question: question })
    } catch (error) {
      res.status(422).json({ error: 'Unprocessable entity' })
    }
  })

  router.route('/questions/:id').put(async (req, res) => {
    try {
      const updatedQuestion = await QuestionCtrl.update({
        id: req.params.id,
        question: req.body.question
      })
      res.status(200).json({ question: updatedQuestion })
    } catch (error) {
      res.status(422).json({ error: 'Unprocessable entity' })
    }
  })
}
