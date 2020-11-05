/**
 * Processes incoming socket messages
 */
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const Sentry = require('@sentry/node')
const SessionModel = require('../../models/Session.js')
const config = require('../../config')
const SessionCtrl = require('../../controllers/SessionCtrl.js')
const SocketService = require('../../services/SocketService.js')
const QuillDocService = require('../../services/QuillDocService')

// @todo: duplicate in socketservice.js
const getSessionRoom = sessionId => `sessions-${sessionId}`

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

  // @todo: check if passportSocketIO will throw an error for unauthorized users, if so remove this
  io.use((socket, next) => {
    if (socket.request.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', async function(socket) {
    const {
      request: { user }
    } = socket
    const latestSession = await SessionModel.current(user._id)

    // @note: students don't join the room by default until they are in the session view
    // Join user to their latest session if it has not ended
    if (latestSession && !latestSession.endedAt) {
      socket.join(getSessionRoom(latestSession._id))
      // @todo: utilize SocketService.sessionChange?
      socket.emit('session-change', latestSession)
    }

    // Session management
    socket.on('join', async function(data) {
      // @todo: Throw error and redirect?
      if (!data || !data.sessionId) return

      const { sessionId } = data
      const {
        request: { user }
      } = socket
      let session

      try {
        // @todo: have middleware handle the auth
        if (!user) throw new Error('User not authenticated')
        if (user.isVolunteer && !user.isApproved && !user.isOnboarded)
          throw new Error('Volunteer not approved')

        session = await SessionModel.findById(sessionId)
          .lean()
          .exec()
        if (!session) throw new Error('No session found!')
      } catch (error) {
        // @todo: implement redirect listener client-side
        socket.emit('redirect')
        return
      }

      try {
        await sessionCtrl.join(socket, {
          session,
          user
        })

        const sessionRoom = getSessionRoom(sessionId)
        socket.join(sessionRoom)

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
      // @todo: handle this?
      if (!sessionId) return

      try {
        const newMessage = {
          contents: message,
          user: user._id,
          createdAt: new Date()
        }
        await sessionCtrl.saveMessage({
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
        io.to(socketRoom).emit('messageSend', messageData)
      } catch (error) {
        // @todo: handle error
        console.log(error)
      }
    })

    socket.on('requestQuillState', async ({ sessionId }) => {
      let docState = await QuillDocService.getDoc(sessionId)
      if (!docState) docState = await QuillDocService.createDoc(sessionId)
      socket.to(getSessionRoom(sessionId)).emit('quillState', {
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
