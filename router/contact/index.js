const express = require('express')
const MailService = require('../../services/MailService')

module.exports = function(app) {
  const router = new express.Router()

  router.route('/send').post(function(req, res, next) {
    var responseData = req.body.responseData

    MailService.sendContactForm({ responseData }, function(err) {
      if (err) {
        next(err)
      } else {
        res.json({
          msg: 'Contact form has been sent'
        })
      }
    })
  })

  app.use('/api-public/contact', router)
}
