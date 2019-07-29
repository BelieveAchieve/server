const SessionCtrl = require('../../controllers/SessionCtrl.js')

module.exports = {
  isNotSessionParticipant: function(session, user) {
    const sessionParticipants = [
      session.volunteer || { _id: '' },
      session.student || { _id: '' }
    ]
    console.log('Session participants: ')
    console.log(sessionParticipants.map(e => e._id.toString()))

    return sessionParticipants.findIndex(
      participant => participant._id.toString() === user._id.toString()
    ) === -1
  },
  
  verifySessionParticipantBySessionId: function(sessionId, user, cb) {
    const helpers = this
      
    SessionCtrl.get({
      sessionId: sessionId
    }, function(err, session) {
      if (err) {
        cb(err)
      }
      else if (!user) {
        cb('This action requires a user ID')
      }
      else if (helpers.isNotSessionParticipant(session, user)) {
        cb('Only session participants can perform this action')
      }
      else {
        cb(null, session)
      }
    })
  }
}
