const Session = require('../models/Session')
const User = require('../models/user')

module.exports = {
  getSession: async sessionId => {
    return Session.findOne({ _id: sessionId })
  },

  addPastSession: async function(user, session) {
    const results = await User.update(
      { _id: user._id },
      { $addToSet: { pastSessions: session._id } }
    )
    if (results.nModified === 1) {
      console.log(
        `${session._id} session was added to ` + `${user._id}'s pastSessions`
      )
    }
  },

  endSession: async function(session, user) {
    var student = session.student
    var volunteer = session.volunteer

    // add session to the student and volunteer's pastSessions
    this.addPastSession(student, session)
    if (volunteer) {
      this.addPastSession(volunteer, session)
    }

    await session.endSession(user)
  },

  isSessionFulfilled: function(session) {
    const hasEnded = !!session.endedAt
    const hasVolunteerJoined = !!session.volunteer

    return hasEnded || hasVolunteerJoined
  }
}
