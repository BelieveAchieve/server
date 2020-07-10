const UserCtrl = require('../../controllers/UserCtrl')
const UserService = require('../../services/UserService')
const AwsService = require('../../services/AwsService')
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

    const parsedUser = UserService.parseUser(req.user)
    return res.json({ user: parsedUser })
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

  router.post('/user/volunteer-approval/reference', async (req, res, next) => {
    const { ip } = req
    const { _id } = req.user
    const { referenceName, referenceEmail } = req.body
    await UserService.addReference({
      userId: _id,
      referenceName,
      referenceEmail,
      ip
    })
    res.sendStatus(200)
  })

  router.post('/user/volunteer-approval/reference/delete', async (req, res) => {
    const { ip } = req
    const { _id } = req.user
    const { referenceEmail } = req.body
    await UserService.deleteReference({
      userId: _id,
      referenceEmail,
      ip
    })
    res.sendStatus(200)
  })

  router.get('/user/volunteer-approval/photo-url', async (req, res, next) => {
    const { ip } = req
    const { _id } = req.user
    const photoIdS3Key = await UserService.addPhotoId({ userId: _id, ip })
    const uploadUrl = await AwsService.getPhotoIdUploadUrl({ photoIdS3Key, ip })

    if (uploadUrl) {
      res.json({
        success: true,
        message: 'AWS SDK S3 pre-signed URL generated successfully',
        uploadUrl
      })
    } else {
      res.json({
        success: false,
        message: 'Pre-signed URL error'
      })
    }
  })

  router.post(
    '/user/volunteer-approval/background-information',
    async (req, res) => {
      const { ip } = req
      const { _id } = req.user
      const {
        occupation,
        experience,
        background,
        linkedInUrl,
        languages,
        country,
        state,
        city
      } = req.body

      const update = {
        occupation,
        experience,
        background,
        linkedInUrl,
        languages,
        country,
        state,
        city
      }

      try {
        const {
          volunteerPartnerOrg,
          references,
          photoIdStatus,
          isApproved
        } = await UserService.getUser({ _id })
        await UserService.addBackgroundInfo({
          isApproved,
          volunteerPartnerOrg,
          references,
          photoIdStatus,
          volunteerId: _id,
          ip,
          update
        })
        res.sendStatus(200)
      } catch (error) {
        res.sendStatus(500)
      }
    }
  )

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

      if (user.isVolunteer && user.photoIdS3Key)
        user.photoUrl = await AwsService.getPhotoIdUrl({
          photoIdS3Key: user.photoIdS3Key
        })

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
