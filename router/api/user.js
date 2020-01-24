var UserCtrl = require('../../controllers/UserCtrl')

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
}
