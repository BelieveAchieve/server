const uri = require('querystring').escape

const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const passport = require('../auth/passport')
const QuestionCtrl = require('../../controllers/QuestionCtrl')

console.log('Edu Admin module')

const questionsPath = (category, subcategory) => {
  const query = []

  if (category) {
    query.push(`category=${uri(category)}`)
  }

  if (subcategory) {
    query.push(`subcategory=${uri(subcategory)}`)
  }

  return {
    path: `questions?${query.join('&')}`,
    label: subcategory || category
  }
}

const isActivePage = req => {
  return navUrl => {
    return navUrl === req.path ? 'active' : ''
  }
}

module.exports = app => {
  app.set('view engine', 'ejs')
  app.set('layout', 'layouts/edu')
  app.use(expressLayouts)

  const router = new express.Router()

  router.get('/', async (req, res) => {
    let categories = []

    try {
      categories = await QuestionCtrl.categories()
    } catch (_error) {}

    const adminPages = [{ path: 'questions', label: 'All Questions' }]

    // Add category / subcategory pages to adminPages
    categories.forEach(([cat, subs]) => {
      const entry = [
        questionsPath(cat),
        subs.map(sub => questionsPath(cat, sub))
      ]
      adminPages.push(...entry)
    })

    const isActive = isActivePage(req)
    res.render('edu/index', { adminPages, isActive })
  })

  router.route('/questions').get(async (req, res) => {
    try {
      const questions = await QuestionCtrl.list(req.query || {})

      const isActive = isActivePage(req)
      res.render('edu/questions/index', { questions, isActive })
    } catch (error) {
      res.status(500).send(`Internal Server Error: ${error}`)
    }
  })

  router.route('/questions/new').get((req, res) => {
    const question = {
      possibleAnswers: [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]
    }

    const isActive = isActivePage(req)
    res.render('edu/questions/new', { question, isActive })
  })

  router.route('/questions').post(async (req, res) => {
    try {
      const question = await QuestionCtrl.create(req.body.question)
      res.status(200).json({ question: question })
    } catch (error) {
      res.status(422).json({ error })
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
      res.status(422).json({ error })
    }
  })

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
