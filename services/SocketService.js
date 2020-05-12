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
      if (userSockets[userId] && userSockets[userId] !== socket) {
        // disconnect the user's old socket
        userSockets[userId].disconnect(false)
      }

      userSockets[userId] = socket

      // query database to see if user is a volunteer
      const user = await User.findById(userId, 'isVolunteer').exec()

      if (user && user.isVolunteer) {
        socket.join('volunteers')
      }
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

    emitToUser: function(user, event, ...args) {
      const socket = userSockets[user._id]
      if (socket) {
        socket.emit(event, ...args)
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

    emitSessionChange: async function(sessionId) {
      const session = await getSessionData(sessionId)

      if (session.student) {
        this.emitToUser(session.student, 'session-change', session)
      }

      if (session.volunteer) {
        this.emitToUser(session.volunteer, 'session-change', session)
      }

      await this.updateSessionList()
    },

    emitToOtherUser: async function(sessionId, user, event, ...args) {
      const session = await Session.findById(sessionId)
        .populate([
          { path: 'student', select: '_id' },
          { path: 'volunteer', select: '_id' }
        ])
        .exec()

      const otherUser = session.otherParticipant(user)
      if (otherUser) {
        this.emitToUser(otherUser, event, ...args)
      }
    },

    bump: function(socket, data, err) {
      console.log('Could not join session')
      console.log(err)
      socket.emit('bump', data, err.toString())
    },

    deliverMessage: async function(message, sessionId) {
      const messageData = {
        contents: message.contents,
        name: message.user.firstname,
        userId: message.user._id,
        isVolunteer: message.user.isVolunteer,
        picture: message.user.picture,
        createdAt: message.createdAt
      }
      
      await this.emitToOtherUser(sessionId, message.user, 'messageSend', messageData)
      this.emitToUser(message.user, 'messageSend', messageData)
    }
  }
}
