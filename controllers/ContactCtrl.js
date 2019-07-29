const async = require('async')

const MailService = require('../services/MailService')

module.exports = {
  initiateContact: function (options, callback) {
    const email = options.email
    const responseData = options.responseData
    async.waterfall(
      [
        // Send an email
        function (done) {
          MailService.sendContactForm(
            {
              email: email,
              responseData: responseData
            },
            function (err) {
              done(err, email)
            }
          )
        }
      ],
      callback
    )
  }
}
