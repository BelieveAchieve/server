const UserCtrl = require('../../controllers/UserCtrl')
const passport = require('../auth/passport')
const config = require('../../config')

module.exports = function(router) {
  router.route('/user').get(function(req, res) {
    if (!req.user) {
      return res.status(401).json({
        err: 'Client has no authenticated session'
      })
    }
    return res.json({ user: req.user })
  })

  router.route('/user/volunteer-stats').get(async function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        err: 'Client has no authenticated session'
      })
    }

    try {
      const volunteerStats = await UserCtrl.getVolunteerStats(req.user)
      res.json({ volunteerStats })
    } catch (error) {
      return next(error)
    }
  })

  router.put('/user', function(req, res, next) {
    var data = req.body || {}
    UserCtrl.update(
      {
        userId: req.user._id,
        data: {
          phone: data.phone,
          phonePretty: data.phonePretty,
          college: data.college,
          favoriteAcademicSubject: data.favoriteAcademicSubject
        }
      },
      function(err, parsedUser) {
        if (err) {
          next(err)
        } else {
          res.json({
            user: parsedUser
          })
        }
      }
    )
  })

  /**
   * This is a utility route used by Cypress to clean up after e2e tests
   * Not available for use on production
   */
  router.delete('/user', passport.isAdmin, async function(req, res) {
    if (config.NODE_ENV === 'production') {
      return res.status(405).json({
        err: 'Deleting users is not allowed on production'
      })
    }

    const userEmail = req.body.email
    const deleteResult = await UserCtrl.deleteUserByEmail(userEmail)
    const didDelete = !!deleteResult.deletedCount

    return res.status(200).json({ didDelete })
  })
}
