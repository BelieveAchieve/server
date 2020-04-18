const crypto = require('crypto')

const MailService = require('../services/MailService')

const User = require('../models/User')

module.exports = {
  initiateVerification: async function({ userId }, callback) {
    // Find the user to be verified
    const user = await User.findOne({ _id: userId })
      .select('verified email verificationToken')
      .lean()
      .exec()

    if (!user) {
      throw new Error('No account with that id found')
    }

    if (user.verified) {
      throw new Error('User is already verified')
    }

    let token = user.verificationToken

    // Generate verification token if the user doesn't have one
    if (!user.verificationToken) {
      token = await new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(new Error('Error generating verification token'))
          }

          const hexToken = buf.toString('hex')
          return resolve(hexToken)
        })
      })

      // Save token to user in database
      await User.updateOne({ _id: userId }, { verificationToken: token })
    }

    // Send verification email
    MailService.sendVerification({ email: user.email, token })

    // Temporary support for callback usage
    if (callback) {
      return callback(null)
    }
  },

  finishVerification: async function({ token }) {
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

    MailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.firstname
    })

    const userUpdates = {
      verified: true,
      $unset: { verificationToken: 1 }
    }

    return User.updateOne({ _id: user._id }, userUpdates)
  }
}
