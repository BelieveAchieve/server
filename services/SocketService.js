const Session = require('../models/Session')
const MessageModel = require('../models/Message')

/**
 * Get session data to send to client for a given session ID
 * @param sessionId
 * @returns the session object
 */
async function getSessionData(sessionId) {
  const populateOptions = [
    { path: 'student', select: 'firstname isVolunteer' },
    { path: 'volunteer', select: 'firstname isVolunteer' }
  ]

  const populatedSession = await Session.findById(sessionId)
    .populate(populateOptions)
    .exec()

  return MessageModel.populate(populatedSession, {
    path: 'messages.user',
    select: 'firstname isVolunteer'
  })
}

// @todo: duplicate in sockets.js
const getSessionRoom = sessionId => `sessions-${sessionId}`

module.exports = function(io) {
  return {
    updateSessionList: async function() {
      const sessions = await Session.getUnfulfilledSessions()
      io.in('volunteers').emit('sessions', sessions)
    },

    emitSessionChange: async function(sessionId) {
      const session = await getSessionData(sessionId)
      io.to(getSessionRoom(sessionId)).emit('session-change', session)

      await this.updateSessionList()
    },

    bump: function(socket, data, err) {
      console.log('Could not join session')
      console.log(err)
      socket.emit('bump', data, err.toString())
    }
  }
}
