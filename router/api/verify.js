const passport = require('../auth/passport')

const VerificationCtrl = require('../../controllers/VerificationCtrl')
const User = require('../../models/User')

module.exports = function(router) {
  router.post('/verify/send', async function(req, res) {
    const userId = req.user && req.user._id

    if (!userId) {
      return res.status(401).json({
        err: 'Must be authenticated to send verification email'
      })
    }

    try {
      await VerificationCtrl.initiateVerification({ userId })

      return res.json({ msg: 'Verification email sent' })
    } catch (error) {
      return res.status(404).json({ err: error.toString() })
    }
  })

  router.post('/verify/confirm', async function(req, res) {
    const token = req.body.token

    try {
      await VerificationCtrl.finishVerification({ token })

      return res.json({
        msg: 'Verification successful'
      })
    } catch (error) {
      return res.status(404).json({ err: error.toString() })
    }
  })

  // Get verification token for a user id (admins only)
  router
    .route('/verificationtoken')
    .all(passport.isAdmin)
    .get(async function(req, res, next) {
      const userId = req.query.userid

      try {
        const user = await User.findOne({ _id: userId }, '+verificationToken')

        return res.json({
          verificationToken: user.verificationToken
        })
      } catch (err) {
        return next(err)
      }
    })
}
