const path = require('path')
const uri = require('querystring').escape

const ejs = require('ejs')
const express = require('express')

const passport = require('../auth/passport')
const QuestionCtrl = require('../../controllers/QuestionCtrl')

module.exports = app => {
  console.log('Edu Admin module')

  const router = new express.Router()

  router.get('/', async (req, res) => {
    const templateFile = path.join(path.resolve(__dirname), 'index.html.ejs')

    const adminPages = [{ path: 'questions', label: 'All Questions' }]
    let categories = []

    try {
      categories = await QuestionCtrl.categories()
    } catch (_error) {}

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

    ejs.renderFile(templateFile, { adminPages }, null, (err, str) => {
      if (err) {
        res.send('404 Not Found')
      }
      res.send(str)
    })
  })

  require('./questions')(router)

  app.use('/edu', [passport.isAuthenticated, passport.isAdmin], router)
}
