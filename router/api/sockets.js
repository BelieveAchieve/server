/**
 * Processes incoming socket messages
 */
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const Sentry = require('@sentry/node')
const SessionModel = require('../../models/Session')
const config = require('../../config')
const SessionCtrl = require('../../controllers/SessionCtrl')
const SocketService = require('../../services/SocketService')
const QuillDocService = require('../../services/QuillDocService')
const getSessionRoom = require('../../utils/get-session-room')

module.exports = function(io, sessionStore) {
  const socketService = new SocketService(io)

  const getSocketIdsFromRoom = room =>
    new Promise((resolve, reject) => {
      io.in(room).clients((err, clients) => {
        if (err) return reject(err)
        return resolve(clients)
      })
    })

  const remoteJoinRoom = (socketId, room) =>
    new Promise((resolve, reject) => {
      io.of('/').adapter.remoteJoin(socketId, room, err => {
        if (err) reject(err)
        resolve('success')
      })
    })

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
          throw new Error(message)
        } else {
          console.log(message)
          accept(null, false)
        }
      }
    })
  )

  io.on('connection', async function(socket) {
    const {
      request: { user }
    } = socket
    if (!user) {
      socket.emit('redirect')
      throw new Error('User not authenticated')
    }

    // Join a user to their own room to handle the event where a user might have
    // multiple socket connections open
    socket.join(user._id.toString())

    const latestSession = await SessionModel.current(user._id)

    // @note: students don't join the room by default until they are in the session view
    // Join user to their latest session if it has not ended
    if (latestSession && !latestSession.endedAt) {
      socket.join(getSessionRoom(latestSession._id))
      socket.emit('session-change', latestSession)
    }

    if (user && user.isVolunteer) socket.join('volunteers')

    // Tutor session management
    socket.on('join', async function(data) {
      if (!data || !data.sessionId) {
        socket.emit('redirect')
        return
      }

      const { sessionId } = data
      const {
        request: { user }
      } = socket
      let session

      try {
        // @todo: have middleware handle the auth
        if (!user) throw new Error('User not authenticated')
        if (user.isVolunteer && !user.isApproved)
          throw new Error('Volunteer not approved')

        session = await SessionModel.findById(sessionId)
          .lean()
          .exec()
        if (!session) throw new Error('No session found!')
      } catch (error) {
        socket.emit('redirect')
        return
      }

      try {
        await SessionCtrl.join(socket, {
          session,
          user
        })

        const sessionRoom = getSessionRoom(sessionId)
        const socketIds = await getSocketIdsFromRoom(user._id)
        // Have all of the user's socket connections join the tutoring session room
        for (const id of socketIds) {
          await remoteJoinRoom(id, sessionRoom)
        }

        socketService.emitSessionChange(sessionId)
      } catch (error) {
        socketService.bump(
          socket,
          {
            endedAt: session.endedAt,
            volunteer: session.volunteer || null,
            student: session.student
          },
          error
        )
      }
    })

    socket.on('list', async function() {
      const sessions = await SessionModel.getUnfulfilledSessions()
      socket.emit('sessions', sessions)
    })

    socket.on('typing', function(data) {
      socket.to(getSessionRoom(data.sessionId)).emit('is-typing')
    })

    socket.on('notTyping', function(data) {
      socket.to(getSessionRoom(data.sessionId)).emit('not-typing')
    })

    socket.on('message', async function(data) {
      const { user, sessionId, message } = data
      // @todo: handle this differently?
      if (!sessionId) return

      try {
        const newMessage = {
          contents: message,
          user: user._id,
          createdAt: new Date()
        }
        await SessionCtrl.saveMessage({
          sessionId: data.sessionId,
          user: data.user,
          message: newMessage
        })

        const messageData = {
          contents: newMessage.contents,
          createdAt: newMessage.createdAt,
          isVolunteer: user.isVolunteer,
          userId: user._id
        }

        const socketRoom = getSessionRoom(data.sessionId)
        io.in(socketRoom).emit('messageSend', messageData)
      } catch (error) {
        socket.emit('messageError')
      }
    })

    socket.on('requestQuillState', async ({ sessionId }) => {
      let docState = await QuillDocService.getDoc(sessionId)
      if (!docState) docState = await QuillDocService.createDoc(sessionId)
      socket.emit('quillState', {
        delta: docState
      })
    })

    socket.on('transmitQuillDelta', async ({ sessionId, delta }) => {
      QuillDocService.appendToDoc(sessionId, delta)
      socket.to(getSessionRoom(sessionId)).emit('partnerQuillDelta', {
        delta
      })
    })

    socket.on('transmitQuillSelection', async ({ sessionId, range }) => {
      socket.to(getSessionRoom(sessionId)).emit('quillPartnerSelection', {
        range
      })
    })

    socket.on('error', function(error) {
      console.log('Socket error: ', error)
      Sentry.captureException(error)
    })

    socket.on('resetWhiteboard', async ({ sessionId }) => {
      socket.to(getSessionRoom(sessionId)).emit('resetWhiteboard')
    })
  })
}
