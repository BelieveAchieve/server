const uri = require('querystring').escape

const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const passport = require('../auth/passport')
const QuestionCtrl = require('../../controllers/QuestionCtrl')

console.log('Edu Admin module')

module.exports = app => {
  app.set('view engine', 'ejs')
  app.set('layout', 'layouts/edu.html.ejs')
  app.use(expressLayouts)

  const router = new express.Router()

  router.get('/', async (req, res) => {
    let categories = []

    try {
      categories = await QuestionCtrl.categories()
    } catch (_error) {}

    const adminPages = [{ path: 'questions', label: 'All Questions' }]

    categories.forEach((subs, cat) => {
      const category = {
        path: `questions?category=${uri(cat)}`,
        label: cat
      }

      const subcategories = [...subs].map(sub => ({
        path: `questions?category=${uri(cat)}&subcategory=${uri(sub)}`,
        label: sub
      }))

      adminPages.push(category)
      adminPages.push([...subcategories])
    })

    res.render('edu/index.html.ejs', { adminPages })
  })

  router.route('/questions').get(async (req, res) => {
    try {
      const questions = await QuestionCtrl.list(req.query || {})
      res.render('edu/questions/index.html.ejs', { questions })
    } catch (error) {
      res.status(500).send(`Internal Server Error: ${error}`)
    }
  })

  router.route('/questions/new').get((req, res) => {
    const question = {
      possibleAnswers: [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]
    }

    res.render('edu/questions/new.html.ejs', { questions: [question] })
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
