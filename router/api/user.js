const UserCtrl = require('../../controllers/UserCtrl')
const UserService = require('../../services/UserService')
const MailService = require('../../services/MailService')
const AwsService = require('../../services/AwsService')
const Volunteer = require('../../models/Volunteer')
const passport = require('../auth/passport')
const config = require('../../config')
const UserActionCtrl = require('../../controllers/UserActionCtrl')

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

  // @note: Currently, only volunteers are able to update their profile
  router.put('/user', async (req, res, next) => {
    const { ip } = req
    const { _id } = req.user
    const { phone, isDeactivated } = req.body

    if (isDeactivated !== req.user.isDeactivated) {
      const updatedUser = Object.assign(req.user, { isDeactivated })
      MailService.createContact(updatedUser)

      if (isDeactivated) UserActionCtrl.accountDeactivated(_id, ip)
    }

    try {
      await Volunteer.updateOne({ _id }, { phone, isDeactivated })
      res.sendStatus(200)
    } catch (err) {
      next(err)
    }
  })

  // Admin route to update a user
  router.put('/user/:userId', passport.isAdmin, async (req, res, next) => {
    const { userId } = req.params

    try {
      await UserService.adminUpdateUser({ userId, ...req.body })
      res.sendStatus(200)
    } catch (err) {
      next(err)
    }
  })

  router.post('/user/volunteer-approval/reference', async (req, res, next) => {
    const { ip } = req
    const { _id } = req.user
    const { referenceFirstName, referenceLastName, referenceEmail } = req.body
    await UserService.addReference({
      userId: _id,
      referenceFirstName,
      referenceLastName,
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
        company,
        college,
        linkedInUrl,
        languages,
        country,
        state,
        city
      } = req.body

      const update = {
        occupation,
        experience,
        company,
        college,
        linkedInUrl,
        languages,
        country,
        state,
        city
      }

      try {
        await UserService.addBackgroundInfo({
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

  router.get('/user/referred-friends', async (req, res, next) => {
    try {
      const { user } = req
      const referredFriends = await UserService.getReferredFriends(user._id, {
        firstname: 1
      })
      res.json({ referredFriends })
    } catch (err) {
      next(err)
    }
  })

  router.get('/user/:userId', passport.isAdmin, async function(req, res, next) {
    const { userId } = req.params
    const { page } = req.query

    try {
      const user = await UserService.adminGetUser(userId, parseInt(page))

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

  router.get('/users', passport.isAdmin, async function(req, res, next) {
    try {
      const { users, isLastPage } = await UserService.getUsers(req.query)
      res.json({ users, isLastPage })
    } catch (err) {
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
