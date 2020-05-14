const User = require('../models/User')
const Session = require('../models/Session')
const Sentry = require('@sentry/node')

module.exports = {
  getVolunteerStats: async user => {
    const pastSessions = await Session.find({ volunteer: user._id })
      .select('volunteerJoinedAt endedAt')
      .lean()
      .exec()

    const millisecondsTutored = pastSessions.reduce((totalMs, session) => {
      if (!(session.volunteerJoinedAt && session.endedAt)) {
        return totalMs
      }

      const volunteerJoinDate = new Date(session.volunteerJoinedAt)
      const sessionEndDate = new Date(session.endedAt)
      const sessionLengthMs = sessionEndDate - volunteerJoinDate

      // skip if session was longer than 5 hours
      if (sessionLengthMs > 18000000) {
        return totalMs
      }

      // skip if volunteer joined after the session ended
      if (sessionLengthMs < 0) {
        return totalMs
      }

      return sessionLengthMs + totalMs
    }, 0)

    // milliseconds in an hour = (60,000 * 60) = 3,600,000
    const hoursTutored = (millisecondsTutored / 3600000).toFixed(2)

    const stats = {
      hoursTutored: hoursTutored
    }

    return stats
  },

  deleteUserByEmail: function(userEmail) {
    return User.deleteOne({ email: userEmail }).exec()
  },

  checkReferral: async function(referredByCode) {
    let referredById

    if (referredByCode) {
      try {
        const referredBy = await User.findOne({ referralCode: referredByCode })
          .select('_id')
          .lean()
          .exec()

        referredById = referredBy._id
      } catch (error) {
        Sentry.captureException(error)
      }
    }

    return referredById
  }
}
