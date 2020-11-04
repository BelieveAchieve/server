const VolunteersCtrl = require('../../controllers/VolunteersCtrl')
const UserService = require('../../services/UserService')
const passport = require('../auth/passport')

module.exports = function(router) {
  router.get('/volunteers', passport.isAdmin, function(req, res, next) {
    VolunteersCtrl.getVolunteers(function(volunteers, err) {
      if (err) {
        next(err)
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
    function(req, res, next) {
      var certifiedSubject = req.params.certifiedSubject
      VolunteersCtrl.getVolunteersAvailability(
        {
          certifiedSubject: certifiedSubject
        },
        function(aggAvailabilities, err) {
          if (err) {
            next(err)
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

  router.get('/volunteers/review', passport.isAdmin, async function(req, res) {
    try {
      const { page } = req.query
      const { volunteers, isLastPage } = await UserService.getVolunteersToReview(
        page
      )
      res.json({ volunteers, isLastPage })
    } catch (error) {
      res
        .status(500)
        .json({ err: 'There was an error retrieving the pending volunteers.' })
    }
  })

  router.post('/volunteers/review/:id', passport.isAdmin, async function(
    req,
    res
  ) {
    const { id } = req.params
    const { photoIdStatus, referencesStatus } = req.body

    try {
      await UserService.updatePendingVolunteerStatus({
        volunteerId: id,
        photoIdStatus,
        referencesStatus
      })
      res.sendStatus(200)
    } catch (error) {
      res.status(500).json({ err: error.message })
    }
  })
}
