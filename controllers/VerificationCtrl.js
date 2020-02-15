var async = require('async')
var crypto = require('crypto')

var MailService = require('../services/MailService')

var User = require('../models/User')

module.exports = {
  initiateVerification: function(options, callback) {
    var userId = options.userId

    async.waterfall(
      [
        // Find the user to be verified
        function(done) {
          User.findById(userId, function(err, user) {
            if (err) {
              return done(err)
            }
            if (!user) {
              return done(new Error('No account with that id found.'))
            } else if (user.verified) {
              return done(new Error('User is already verified'))
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

            user.verificationToken = token

            user.save(function(err) {
              done(err, token, user.email)
            })
          })
        },

        // Send an email
        function(token, email, done) {
          MailService.sendVerification(
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

  finishVerification: function(options, callback) {
    var token = options.token

    // make sure token is a valid 16-byte hex string
    if (!token.match(/^[a-f0-9]{32}$/)) {
      // early exit
      return callback(new Error('Invalid verification token'))
    }
    
    async.waterfall(
      [
        function(done) {
          User.findOne({ verificationToken: token }, function(err, user) {
            if (!user) {
              return done(
                new Error('No user found with that verification token')
              )
            } else if (err) {
              return done(err)
            }
            done(null, user)
          })
        },
        function(user, done) {
          user.verificationToken = undefined
          user.verified = true
          user.save(function(err) {
            done(err, user)
          })
        }
      ],
      callback
    )
  }
}
