const User = require('../models/User')

module.exports = {
  getUser: query => {
    return User.findOne(query)
      .lean()
      .exec()
  },

  banUser: async ({ userId, banReason }) => {
    return User.updateOne(
      { _id: userId },
      { $set: { isBanned: true, banReason } }
    )
  }
}
