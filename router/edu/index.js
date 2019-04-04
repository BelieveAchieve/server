const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const passport = require('../auth/passport')
const QuestionCtrl = require('../../controllers/QuestionCtrl')
const { questionsPath, isActivePage } = require('./helpers')

console.log('Edu Admin module')

module.exports = app => {
  app.set('view engine', 'ejs')
  app.set('layout', 'layouts/edu')
  app.use(expressLayouts)

  const router = new express.Router()

  // GET /edu
  router.get('/', async (req, res) => {
    try {
      const categories = (await QuestionCtrl.categories()).reduce(
        (acc, [category, subcategories]) => [
          ...acc,
          questionsPath(category),
          subcategories.map(subcategory => questionsPath(category, subcategory))
        ],
        []
      )

      res.render('edu/index', {
        adminPages: [
          { path: 'questions', label: 'All Questions' },
          ...categories
        ],
        isActive: isActivePage(req)
      })
    } catch (error) {
      res.status(500).send(`Internal Server Error: ${error}`)
    }
  })

  // GET /edu/questions
  router.route('/questions').get(async (req, res) => {
    try {
      const questions = await QuestionCtrl.list(req.query || {})
      const isActive = isActivePage(req)
      res.render('edu/questions/index', { questions, isActive })
    } catch (error) {
      res.status(500).send(`Internal Server Error: ${error}`)
    }
  })

  // GET /edu/questions/new
  router.route('/questions/new').get((req, res) => {
    const question = {
      possibleAnswers: [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]
    }
    const isActive = isActivePage(req)
    res.render('edu/questions/new', { question, isActive })
  })

  // POST[JSON] /edu/questions
  router.route('/questions').post(async (req, res) => {
    try {
      const question = await QuestionCtrl.create(req.body.question)
      res.status(200).json({ question: question })
    } catch (error) {
      res.status(422).json({ error })
    }
  })

  // PUT[JSON] /edu/questions/:id
  router.route('/questions/:id').put(async (req, res) => {
    try {
      const updatedQuestion = await QuestionCtrl.update({
        id: req.params.id,
        question: req.body.question
      })
      res.status(200).json({ question: updatedQuestion })
    } catch (error) {
      res.status(422).json({ error })
    }
  })

  // DELETE[JSON] /edu/questions/:id
  router.route('/questions/:id').delete(async (req, res) => {
    try {
      const question = await QuestionCtrl.destroy(req.params.id)
      res.status(200).json({ question: question })
    } catch (error) {
      res.status(422).json({ error })
    }
  })

  app.use('/edu', [passport.isAuthenticated, passport.isAdmin], router)
}
