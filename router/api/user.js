const UserCtrl = require('../../controllers/UserCtrl')
const passport = require('../auth/passport')
const config = require('../../config.js')

module.exports = function(router) {
  router.route('/user').get(function(req, res) {
    if (!req.user) {
      return res.status(401).json({
        err: 'Client has no authenticated session'
      })
    }

    // Return student user
    if (!req.user.isVolunteer) {
      return res.json({
        user: req.user.parseProfile()
      })
    }

    // Return volunteer user
    req.user
      .populateForVolunteerStats()
      .execPopulate()
      .then(populatedUser => {
        return res.json({
          user: populatedUser.parseProfile()
        })
      })
  })

  router.put('/user', function(req, res, next) {
    var data = req.body || {}
    UserCtrl.update(
      {
        userId: req.user._id,
        data: {
          firstname: data.firstname,
          lastname: data.lastname,
          preferredTimes: data.preferredTimes,
          phone: data.phone,
          phonePretty: data.phonePretty,
          college: data.college,
          favoriteAcademicSubject: data.favoriteAcademicSubject,
          heardFrom: data.heardFrom,
          referred: data.referred,
          pastSessions: data.pastSessions
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
