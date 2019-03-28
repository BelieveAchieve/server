const path = require('path')

const ejs = require('ejs')

const QuestionCtrl = require('../../controllers/QuestionCtrl')

module.exports = router => {
  router.route('/questions').get((req, res) => {
    QuestionCtrl.list().then(questions => {
      const templateName = 'questions'
      const templatesDir = path.join(path.resolve(__dirname), 'templates')
      const templateFile = path.join(templatesDir, `${templateName}.ejs`)
      ejs.renderFile(templateFile, { questions }, null, (err, str) => {
        if (err) {
          res.send('404 Not Found')
        }
        res.send(str)
      })
    })
  })
}
