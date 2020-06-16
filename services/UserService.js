const crypto = require('crypto')
const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const { PHOTO_ID_STATUS } = require('../constants')

module.exports = {
  banUser: async ({ userId, banReason }) => {
    return User.updateOne(
      { _id: userId },
      { $set: { isBanned: true, banReason } }
    )
  },

  addPhotoId: async ({ userId }) => {
    const photoIdS3Key = crypto.randomBytes(32).toString('hex')
    await Volunteer.updateOne(
      { _id: userId },
      { $set: { photoIdS3Key, photoIdStatus: PHOTO_ID_STATUS.SUBMITTED } }
    )
    return photoIdS3Key
  },

  addLinkedIn: async ({ userId, linkedInUrl }) => {
    const urlPattern = RegExp(/.*linkedin\.com.*\/in\/.+/)
    const isMatch = urlPattern.test(linkedInUrl)
    if (!isMatch) return false
    await Volunteer.updateOne({ _id: userId }, { $set: { linkedInUrl } })
    return true
  },

  addReference: async ({ userId, referenceName, referenceEmail }) => {
    const referenceData = {
      name: referenceName,
      email: referenceEmail
    }
    await Volunteer.updateOne(
      { _id: userId },
      { $push: { references: referenceData } }
    )
  },

  deleteReference: async ({ userId, referenceEmail }) => {
    return Volunteer.updateOne(
      { _id: userId },
      { $pull: { references: { email: referenceEmail } } }
    )
  }
}
