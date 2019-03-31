const path = require('path')

const ejs = require('ejs')

const QuestionCtrl = require('../../controllers/QuestionCtrl')

module.exports = router => {
  router.route('/questions').get(async (req, res) => {
    const templateName = 'questions'
    const templatesDir = path.join(path.resolve(__dirname), 'templates')
    const templateFile = path.join(templatesDir, `${templateName}.ejs`)
    let questions = []

    try {
      questions = await QuestionCtrl.list()

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

  router.route('/question/:id').put(async (req, res) => {
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
