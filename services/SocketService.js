const User = require('../models/User')
const Session = require('../models/Session')

const userSockets = {} // userId => socket

module.exports = function (io) {
  return {
    // to be called by router/api/sockets.js when user connects socket and authenticates
    connectUser: async function (userId, socket) {
      userSockets[userId] = socket

      // query database to see if user is a volunteer
      const user = await User.findById(userId, 'isVolunteer').exec()

      if (user.isVolunteer) {
        socket.join('volunteers')
      }

      // query all active sessions in which user is a participant
      const activeSessions = await Session.find({
        $or: [
          { student: userId },
          { volunteer: userId }
        ]
      }, '_id')
        .exec()

      // join all rooms corresponding to active sessions
      activeSessions.forEach((session) => socket.join(session._id))
    },

    // to be called by router/api/sockets.js when user socket disconnects
    disconnectUser: function (socket) {
      const userId = Object.keys(userSockets).find((id) => userSockets[id] === socket)

      if (userId) {
        delete userSockets[userId]
      }
    },

    // update the list of sessions displayed on the volunteer web page
    updateSessionList: async function () {
      const sessions = await Session.getUnfulfilledSessions()
      io.in('volunteers').emit('sessions', sessions)
    },

    emitNewSession: async function (session) {
      io.in('volunteers').emit('new-session', {
        _id: session._id,
        type: session.type,
        studentName: session.student.firstname
      })
      await this.updateSessionList()
    },

    emitSessionEnd: async function (sessionId) {
      const session = await Session.findById(sessionId)
      io.in(sessionId).emit('session-change', session)
      io.in('volunteers').emit('session-end', sessionId)
      await this.updateSessionList()
    },

    joinUserToSession: async function (sessionId, userId, socket) {
      console.log('Joining session...', sessionId)

      // keep reference to old socket so we can disconnect it if we need to
      const oldSocket = userId in userSockets ? userSockets[userId] : null

      // store user's socket in userSockets
      userSockets[userId] = socket

      // get session data
      const populateOptions = [
        { path: 'student', select: 'firstname isVolunteer' },
        { path: 'volunteer', select: 'firstname isVolunteer' }
      ]

      const session = await Session.findById(sessionId)
        .populate(populateOptions)
        .exec()

      socket.join(sessionId)

      io.in('volunteers').emit('session-fulfilled', {
        sessionId: sessionId
      })
      io.in(sessionId).emit('session-change', session)
      await this.updateSessionList()

      // if user had a different socket, disconnect the old one
      if (oldSocket && oldSocket.id !== socket.id) {
        oldSocket.disconnect(false)
      }
    },

    bump: function (socket, err) {
      console.log('Could not join session')
      console.log(err)
      io.emit('error', err.toString())
      socket.emit('bump', err.toString())
    },

    deliverMessage: function (message, sessionId) {
      io.to(sessionId).emit('messageSend', {
        contents: message.contents,
        name: message.user.firstname,
        email: message.user.email,
        isVolunteer: message.user.isVolunteer,
        picture: message.user.picture,
        createdAt: message.createdAt
      })
    }
  }
}
