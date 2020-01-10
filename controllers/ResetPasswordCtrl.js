var async = require('async')
var crypto = require('crypto')

var MailService = require('../services/MailService')

var User = require('../models/User')

module.exports = {
  initiateReset: function (options, callback) {
    var email = options.email

    async.waterfall(
      [
        // Find the user whose password is to be reset
        function (done) {
          User.findOne({ email: email }, function (err, user) {
            if (err) {
              console.log(`ERROR: ${err}`)
              return done(err)
            }

            if (!user) {
              return done(new Error('No account with that id found.'))
            }

            done(null, user)
          })
        },

        // Generate the token and save token and user email to database
        function (user, done) {
          crypto.randomBytes(16, function (err, buf) {
            if (err) {
              return done(err)
            }
            
            var token = buf.toString('hex')
            user.passwordResetToken = token

            user.save(function (err) {
              done(err, token, user.email)
            })
          })
        },

        // Send an email
        function (token, email, done) {
          MailService.sendReset(
            {
              email: email,
              token: token
            },
            function (err) {
              done(err, email)
            }
          )
        }
      ],
      callback
    )
  },

  finishReset: function (options, callback) {
    var email = options.email
    var token = options.token

    async.waterfall(
      [
        // Find the user whose password is being reset and check if email matches
        function (done) {
          User.findOne({ passwordResetToken: token }, function (err, user) {
            if (!user) {
              return done(
                new Error('No user found with that password reset token')
              )
            } else if (err) {
              return done(err)
            } else if (user.email !== email) {
              return done(
                new Error('Email did not match the password reset token')
              )
            }
            done(null, user)
          })
        },

        function (user, done) {
          user.passwordResetToken = undefined
          user.save(function (err) {
            done(err, user)
          })
        }
      ],
      callback
    )
  }
}
