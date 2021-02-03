const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const config = require('../../../config')
const passport = require('../../auth/passport')
const Question = require('../../../models/Question')
const QuestionCtrl = require('../../../controllers/QuestionCtrl')
const { questionsPath, isActivePage, frontEndPath } = require('./helpers')
const logger = require('../../../logger')

const edu = express()
edu.set('view engine', 'ejs')
edu.set('layout', 'layouts/edu')
edu.use(expressLayouts)
edu.locals = {
  homeLink: config.NODE_ENV === 'dev' ? 'http://localhost:8080' : '/',
  frontEndRoot:
    config.NODE_ENV === 'dev' ? new URL('http://localhost:8080') : null
}

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
    logger.error(error)
    res.status(500).send(`<h1>Internal Server Error</h1> <pre>${error}</pre>`)
  }
})

// GET /edu/questions
edu.route('/questions').get(async (req, res) => {
  try {
    const questions = await QuestionCtrl.list(req.query || {})
    const isActive = isActivePage(req)

    // question._id --> URL
    const imagePaths = questions.reduce((map, question) => {
      map[question._id] = frontEndPath(
        question.imageSrc,
        edu.locals.frontEndRoot
      )
      return map
    }, {})

    res.render('edu/questions/index', { questions, isActive, imagePaths })
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

// POST[JSON] /edu/categoryquestions
eduApi.post('/categoryquestions', async (req, res) => {
  const category = req.body.category.toString()

  const skip = req.body.skip

  const limit = req.body.limit

  try {
    const questions = await Question.find({ category }, null, {
      skip,
      limit
    }).exec()
    res.status(200).json({ questions: questions })
  } catch (error) {
    res.status(422).json({ error: error.toString() })
  }
})

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
