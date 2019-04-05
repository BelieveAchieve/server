const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const passport = require('../auth/passport')
const QuestionCtrl = require('../../controllers/QuestionCtrl')
const { questionsPath, isActivePage } = require('./helpers')

console.log('Edu Admin module')

const edu = express()
edu.set('view engine', 'ejs')
edu.set('layout', 'layouts/edu')
edu.use(expressLayouts)

// GET /edu
edu.get('/', async (req, res) => {
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
    res.status(500).send(`<h1>Internal Server Error</h1> <pre>${error}</pre>`)
  }
})

// GET /edu/questions
edu.route('/questions').get(async (req, res) => {
  try {
    const questions = await QuestionCtrl.list(req.query || {})
    const isActive = isActivePage(req)
    res.render('edu/questions/index', { questions, isActive })
  } catch (error) {
    res.status(500).send(`<h1>Internal Server Error</h1> <pre>${error}</pre>`)
  }
})

// GET /edu/questions/new
edu.route('/questions/new').get((req, res) => {
  const question = {
    possibleAnswers: [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]
  }
  const isActive = isActivePage(req)
  res.render('edu/questions/new', { question, isActive })
})

const eduApi = express()

// POST[JSON] /edu/questions
eduApi.post('/questions', async (req, res) => {
  try {
    const question = await QuestionCtrl.create(req.body.question)
    res.status(200).json({ question: question })
  } catch (error) {
    res.status(422).json({ error })
  }
})

// PUT[JSON] /edu/questions/:id
eduApi.put('/questions/:id', async (req, res) => {
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
eduApi.delete('/questions/:id', async (req, res) => {
  try {
    const question = await QuestionCtrl.destroy(req.params.id)
    res.status(200).json({ question: question })
  } catch (error) {
    res.status(422).json({ error })
  }
})

module.exports = rootApp => {
  rootApp.use(
    '/edu',
    [passport.isAuthenticatedRedirect, passport.isAdminRedirect],
    edu
  )
  rootApp.use('/edu', [passport.isAuthenticated, passport.isAdmin], eduApi)
}
