var VolunteersCtrl = require('../../controllers/VolunteersCtrl')
var passport = require('../auth/passport')

module.exports = function(router) {
  router.get('/volunteers', passport.isAdmin, function(req, res) {
    VolunteersCtrl.getVolunteers(function(volunteers, err) {
      if (err) {
        res.json({ err: err })
      } else {
        res.json({
          msg: 'Users retreived from database',
          volunteers: volunteers
        })
      }
    })
  })

  router.get(
    '/volunteers/availability/:certifiedSubject',
    passport.isAdmin,
    function(req, res) {
      var certifiedSubject = req.params.certifiedSubject
      VolunteersCtrl.getVolunteersAvailability(
        {
          certifiedSubject: certifiedSubject
        },
        function(aggAvailabilities, err) {
          if (err) {
            res.json({ err: err })
          } else {
            res.json({
              msg: 'Users retreived from database',
              aggAvailabilities: aggAvailabilities
            })
          }
        }
      )
    }
  )
}
