const UserCtrl = require('../../controllers/UserCtrl')
const User = require('../../models/User')
const Volunteer = require('../../models/Volunteer')
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

  // @note: Currently, only volunteers are able to update their profile
  router.put('/user', async (req, res, next) => {
    const { _id } = req.user
    const { phone, college, favoriteAcademicSubject } = req.body

    try {
      await Volunteer.updateOne(
        { _id },
        { phone, college, favoriteAcademicSubject }
      )
      res.sendStatus(200)
    } catch (err) {
      next(err)
    }
  })

  router.get('/user/:userId', passport.isAdmin, async function(req, res, next) {
    const { userId } = req.params

    try {
      const user = await User.findOne({ _id: userId })
        .populate({
          path: 'pastSessions',
          options: {
            sort: { createdAt: -1 },
            limit: 50
          }
        })
        .populate('approvedHighschool')
        .lean()
        .exec()

      res.json({ user })
    } catch (err) {
      console.log(err)
      next(err)
    }
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
