const express = require('express')

const config = require('../../config.js')
const MailService = require('../../services/MailService')

module.exports = function (app) {
  const router = new express.Router()

  router.route('/send').post(function (req, res, next) {
    var responseData = req.body.responseData
    var email = config.mail.receivers.contact

    MailService.sendContactForm(
      {
        email: email,
        responseData: responseData
      },
      function (err) {
        if (err) {
          next(err)
        } else {
          res.json({
            msg: 'Contact form has been sent'
          })
        }
      }
    )
  })

  app.use('/contact', router)
}
