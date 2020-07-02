const Notification = require('../models/Notification')
const SessionService = require('../services/SessionService')

module.exports = {
  getSessionNotifications: async sessionId => {
    const session = await SessionService.getSession(sessionId)
    return Notification.aggregate([
      {
        $match: {
          $expr: {
            $in: ['$_id', session.notifications]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'volunteer',
          foreignField: '_id',
          as: 'volunteer'
        }
      },
      { $unwind: '$volunteer' }
    ]).exec()
  }
}
