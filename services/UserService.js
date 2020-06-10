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

  addPhotoId: async ({ userId, photoIdUrl }) => {
    return Volunteer.updateOne(
      { _id: userId },
      { $set: { photoIdUrl, photoIdStatus: PHOTO_ID_STATUS.PENDING } }
    )
  }
}
