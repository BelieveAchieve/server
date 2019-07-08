var async = require('async')

var MailService = require('../services/MailService')

module.exports = {
  initiateContact: function (options, callback) {
    // var responseData = options.responseData
    var email = options.email
    var responseData = options.responseData
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
