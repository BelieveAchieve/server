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
    const templateName = 'index'
    const templatesDir = path.join(path.resolve(__dirname), 'templates')
    const templateFile = path.join(templatesDir, `${templateName}.ejs`)

    const adminPages = [{ path: 'questions', label: 'All Questions' }]
    let categories = []

    try {
      categories = await QuestionCtrl.categories()
    } catch (_error) {}

    categories.forEach((subLabels, categoryLabel) => {
      const category = {
        path: `questions?category=${uri(categoryLabel)}`,
        label: categoryLabel
      }

      const subcategories = [...subLabels].map(subcategory => ({
        path: `questions?category=${uri(categoryLabel)}&subcategory=${uri(
          subcategory
        )}`,
        label: subcategory
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

  app.use('/edu', passport.isAuthenticated, router)
}
