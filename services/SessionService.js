const Session = require('../models/Session')
const User = require('../models/User')

const addPastSession = async ({ userId, sessionId }) => {
  await User.update({ _id: userId }, { $addToSet: { pastSessions: sessionId } })
}

module.exports = {
  getSession: async sessionId => {
    return Session.findOne({ _id: sessionId })
  },

  endSession: async ({ session, endedBy = null }) => {
    await addPastSession(session.student, session._id)
    if (session.volunteer) await addPastSession(session.volunteer, session._id)

    await Session.updateOne(
      { _id: session._id },
      {
        endedAt: new Date(),
        endedBy
      }
    )
  },

  isSessionFulfilled: function(session) {
    const hasEnded = !!session.endedAt
    const hasVolunteerJoined = !!session.volunteer

    return hasEnded || hasVolunteerJoined
  }
}
