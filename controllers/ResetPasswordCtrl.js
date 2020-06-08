var async = require('async')
var crypto = require('crypto')

var MailService = require('../services/MailService')

var User = require('../models/User')

module.exports = {
  initiateReset: function(options, callback) {
    var email = options.email

    async.waterfall(
      [
        // Find the user whose password is to be reset
        function(done) {
          User.findOne({ email: email }, function(err, user) {
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
        function(user, done) {
          crypto.randomBytes(16, function(err, buf) {
            if (err) {
              return done(err)
            }

            var token = buf.toString('hex')
            user.passwordResetToken = token

            user.save(function(err) {
              done(err, token, user.email)
            })
          })
        },

        // Send an email
        function(token, email, done) {
          MailService.sendReset(
            {
              email: email,
              token: token
            },
            function(err) {
              done(err, email)
            }
          )
        }
      ],
      callback
    )
  },

  finishReset: async function({ email, password, token }) {
    // make sure token is a valid 16-byte hex string
    if (!token.match(/^[a-f0-9]{32}$/)) {
      // early exit
      throw new Error('Invalid password reset token')
    }

    try {
      const user = await User.findOne({ passwordResetToken: token })

      if (!user) throw new Error('No user found with that password reset token')

      if (user.email !== email)
        throw new Error('Email did not match the password reset token')

      user.passwordResetToken = undefined
      user.password = await user.hashPassword(password)
      await user.save()
    } catch (error) {
      throw new Error(error.message)
    }
  }
}
