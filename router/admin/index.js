const path = require('path')

const ejs = require('ejs')
const express = require('express')

const passport = require('../auth/passport')

module.exports = app => {
  console.log('Admin module')

  const router = new express.Router()

  router.get('/', (req, res) => {
    const templateName = 'index'
    const templatesDir = path.join(path.resolve(__dirname), 'templates')
    const templateFile = path.join(templatesDir, `${templateName}.ejs`)
    const adminPages = [{ path: 'questions', label: 'Questions' }]

    ejs.renderFile(templateFile, { adminPages }, null, (err, str) => {
      if (err) {
        res.send('404 Not Found')
      }
      res.send(str)
    })
  })

  require('./questions')(router)

  app.use('/admin', passport.isAuthenticated, router)
}
