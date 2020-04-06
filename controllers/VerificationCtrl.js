const async = require('async')
const crypto = require('crypto')

const MailService = require('../services/MailService')

const User = require('../models/User')

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

  finishVerification: async function(options, callback) {
    const token = options.token

    // make sure token is a valid 16-byte hex string
    if (!token.match(/^[a-f0-9]{32}$/)) {
      // early exit
      throw new Error('Invalid verification token')
    }

    const user = await User.findOne({ verificationToken: token })
      .select('firstname email')
      .lean()
      .exec()

    if (!user) {
      throw new Error('No user found with that verification token')
    }

    const userUpdates = {
      verified: true,
      $unset: { verificationToken: 1 }
    }

    await User.updateOne({ _id: user._id }, userUpdates)

    MailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.firstname
    })

    return user
  }
}
