/**
 * Processes incoming socket messages
 */

const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')

const Session = require('../../models/Session.js')

const config = require('../../config')
const SessionCtrl = require('../../controllers/SessionCtrl.js')
const SocketService = require('../../services/SocketService.js')

// todo handle errors in try-catch blocks

module.exports = function(io, sessionStore) {
  const socketService = SocketService(io)
  const sessionCtrl = SessionCtrl(socketService)

  // Authentication for sockets
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'connect.sid',
      secret: config.sessionSecret,
      store: sessionStore,
      // only allow authenticated users to connect to the socket instance
      fail: (data, message, error, accept) => {
        if (error) {
          console.log(new Error(message))
        } else {
          console.log(message)
          accept(null, false)
        }
      }
    })
  )

  io.on('connection', async function(socket) {
    // store user and socket in SocketService
    const connectPromise = socketService.connectUser(
      socket.request.user._id,
      socket
    )

    // Session management
    socket.on('join', async function(data) {
      if (!data || !data.sessionId) {
        return
      }

      // wait for socketService.connectUser to complete before joining
      await connectPromise.then(() => {
        sessionCtrl.join(socket, {
          sessionId: data.sessionId,
          user: socket.request.user
        })
      })
    })

    socket.on('disconnect', function() {
      console.log('Client disconnected. User ID:', socket.request.user._id)

      socketService.disconnectUser(socket)
    })

    socket.on('list', async function() {
      const sessions = await Session.getUnfulfilledSessions()
      socket.emit('sessions', sessions)
    })

    socket.on('typing', function(data) {
      socketService.emitToOtherUser(
        data.sessionId,
        socket.request.user._id,
        'is-typing'
      )
    })

    socket.on('notTyping', function(data) {
      socketService.emitToOtherUser(
        data.sessionId,
        socket.request.user._id,
        'not-typing'
      )
    })

    socket.on('message', async function(data) {
      if (!data.sessionId) return

      await sessionCtrl.message(data)
    })
  })
}
