const User = require('../models/User')
const Session = require('../models/Session')
const Message = require('../models/Message')

const userSockets = {} // userId => socket

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

  return Message.populate(populatedSession, {
    path: 'messages.user',
    select: 'firstname isVolunteer picture'
  })
}

module.exports = function(io) {
  return {
    // to be called by router/api/sockets.js when user connects socket and authenticates
    connectUser: async function(userId, socket) {
      userSockets[userId] = socket

      // query database to see if user is a volunteer
      const user = await User.findById(userId, 'isVolunteer').exec()

      if (user && user.isVolunteer) {
        socket.join('volunteers')
      }

      // query all active sessions in which user is a participant
      const activeSessions = await Session.find(
        {
          $or: [{ student: userId }, { volunteer: userId }],
          endedAt: { $exists: false }
        },
        '_id'
      ).exec()

      // join all rooms corresponding to active sessions
      activeSessions.forEach(session => socket.join(session._id))
    },

    // to be called by router/api/sockets.js when user socket disconnects
    disconnectUser: function(socket) {
      const userId = Object.keys(userSockets).find(
        id => userSockets[id] === socket
      )

      if (userId) {
        delete userSockets[userId]
      }
    },

    // update the list of sessions displayed on the volunteer web page
    updateSessionList: async function() {
      const sessions = await Session.getUnfulfilledSessions()
      io.in('volunteers').emit('sessions', sessions)
    },

    emitNewSession: async function(session) {
      await this.updateSessionList()
    },

    emitSessionEnd: async function(sessionId) {
      const session = await getSessionData(sessionId)
      io.in(sessionId).emit('session-change', session)
      await this.updateSessionList()
    },

    joinUserToSession: async function(sessionId, userId, socket) {
      console.log('Joining session...', sessionId)

      // keep reference to old socket so we can disconnect it if we need to
      const oldSocket = userId in userSockets ? userSockets[userId] : null

      // store user's socket in userSockets
      userSockets[userId] = socket

      const session = await getSessionData(sessionId)

      socket.join(sessionId)

      io.in(sessionId).emit('session-change', session)
      await this.updateSessionList()

      // if user had a different socket, disconnect the old one
      if (oldSocket && oldSocket.id !== socket.id) {
        oldSocket.disconnect(false)
      }
    },

    bump: function(socket, data, err) {
      console.log('Could not join session')
      console.log(err)
      socket.emit('bump', data, err.toString())
    },

    deliverMessage: function(message, sessionId) {
      io.to(sessionId).emit('messageSend', {
        contents: message.contents,
        name: message.user.firstname,
        userId: message.user._id,
        isVolunteer: message.user.isVolunteer,
        picture: message.user.picture,
        createdAt: message.createdAt
      })
    }
  }
}
