const passport = require('../auth/passport')

var VerificationCtrl = require('../../controllers/VerificationCtrl')

const User = require('../../models/User')

module.exports = function(router) {
  router.post('/verify/send', function(req, res, next) {
    var userId = req.user && req.user._id

    if (!userId) {
      return res.status(401).json({
        err: 'Must be authenticated to send verification email'
      })
    }

    VerificationCtrl.initiateVerification(
      {
        userId: userId
      },
      function(err, email) {
        if (err) {
          next(err)
        } else {
          res.json({ msg: 'Verification email sent to ' + email })
        }
      }
    )
  })

  router.post('/verify/confirm', function(req, res, next) {
    var token = req.body.token
    VerificationCtrl.finishVerification(
      {
        token: token
      },
      function(err, user) {
        if (err) {
          res.status(404).json({ err: err.toString() })
        } else {
          res.json({
            msg: 'Verification successful'
          })
        }
      }
    )
  })

  // Get verification token for a user id (admins only)
  router
    .route('/verificationtoken')
    .all(passport.isAdmin)
    .get(async function(req, res, next) {
      const userId = req.query.userid

      try {
        const user = await User.findOne({ _id: userId }, '+verificationToken')

        res.json({
          verificationToken: user.verificationToken
        })
      } catch (err) {
        next(err)
      }
    })
}
