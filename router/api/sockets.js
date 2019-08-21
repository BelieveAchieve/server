const fs = require('fs')
const http = require('http')
const https = require('https')
const socket = require('socket.io')

const config = require('../../config.js')
const SessionCtrl = require('../../controllers/SessionCtrl.js')

// Create an HTTPS server if in production, otherwise use HTTP.
const createServer = app => {
  if (config.NODE_ENV === 'production') {
    return https.createServer(
      {
        key: fs.readFileSync(`${config.SSL_CERT_PATH}/privkey.pem`),
        cert: fs.readFileSync(`${config.SSL_CERT_PATH}/fullchain.pem`),
        ca: fs.readFileSync(`${config.SSL_CERT_PATH}/chain.pem`)
      },
      app
    )
  } else {
    return http.createServer(app)
  }
}

module.exports = function (app) {
  const server = createServer(app)
  const io = socket(server)

  io.on('connection', function (socket) {
    // Session management
    socket.on('join', function (data) {
      if (!data || !data.sessionId) {
        return
      }
      console.log('Joining session...', data.sessionId)

      SessionCtrl.joinSession(
        {
          sessionId: data.sessionId,
          user: data.user,
          socket: socket
        },
        function (err, session) {
          if (err) {
            console.log('Could not join session')
            io.emit('error', err)
            socket.emit('bump', err)
            return
          }

          socket.join(data.sessionId)
          io.emit('sessions', SessionCtrl.getSocketSessions())
          io.to(session._id).emit('session-change', session)
        }
      )
    })

    socket.on('disconnect', function () {
      console.log('Client disconnected')

      SessionCtrl.leaveSession(
        {
          socket: socket
        },
        function (err, session) {
          if (err) {
            console.log('Error leaving session', err)
          } else if (session) {
            console.log('Left session', session._id)
            socket.leave(session._id)
            io.to(session._id).emit('session-change', session)
            io.emit('sessions', SessionCtrl.getSocketSessions())
          }
        }
      )
    })

    socket.on('list', function () {
      io.emit('sessions', SessionCtrl.getSocketSessions())
    })

    socket.on('typing', function (data) {
      socket.broadcast.to(data.sessionId).emit('is-typing', data.user.firstname)
    })

    socket.on('notTyping', function (data) {
      socket.broadcast.to(data.sessionId).emit('not-typing')
    })

    socket.on('message', function (data) {
      if (!data.sessionId) return

      const message = {
        user: data.user,
        contents: data.message
      }

      SessionCtrl.get(
        {
          sessionId: data.sessionId
        },
        function (err, session) {
          // Don't let anyone but the session's student or volunteer create messages
          if (err || SessionCtrl.isNotSessionParticipant(session, data.user)) {
            console.log('Could not deliver message')
            io.emit('error', err || 'Only session participants are allowed to send messages')
            return
          }

          session.saveMessage(message, function (err, savedMessage) {
            io.to(data.sessionId).emit('messageSend', {
              contents: savedMessage.contents,
              name: data.user.firstname,
              email: data.user.email,
              isVolunteer: data.user.isVolunteer,
              picture: data.user.picture,
              time: savedMessage.createdAt
            })
          })
        }
      )
    })

    // Whiteboard interaction
    // all of this is now blocked for non-participants

    socket.on('canvasLoaded', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('size', {
          height: data.height
        })
      })
    })

    socket.on('drawClick', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('draw', {
          x: data.x,
          y: data.y,
          type: data.type
        })
      })
    })

    socket.on('saveImage', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('save')
      })
    })

    socket.on('undoClick', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('undo')
      })
    })

    socket.on('clearClick', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        io.to(data.sessionId).emit('clear')
      })
    })

    socket.on('drawing', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('draw')
      })
    })

    socket.on('end', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err, session) {
        if (err) return
        session.saveWhiteboardUrl(data.whiteboardUrl)
        socket.broadcast.to(data.sessionId).emit('end', data)
      })
    })

    socket.on('changeColor', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('color', data.color)
      })
    })

    socket.on('changeWidth', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('width', data.width)
      })
    })

    socket.on('dragStart', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('dstart', {
          x: data.x,
          y: data.y,
          color: data.color
        })
      })
    })

    socket.on('dragAction', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('drag', {
          x: data.x,
          y: data.y,
          color: data.color
        })
      })
    })

    socket.on('dragEnd', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        socket.broadcast.to(data.sessionId).emit('dend', {
          x: data.x,
          y: data.y,
          color: data.color
        })
      })
    })

    socket.on('insertText', function (data) {
      if (!data || !data.sessionId) return
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        io.to(data.sessionId).emit('text', {
          text: data.text,
          x: data.x,
          y: data.y
        })
      })
    })

    socket.on('resetScreen', function (data) {
      SessionCtrl.verifySessionParticipantBySessionId(data.sessionId, data.user, function (err) {
        if (err) return
        io.to(data.sessionId).emit('reset')
      })
    })
  })

  const port = config.socketsPort
  server.listen(port)

  console.log('Sockets.io listening on port ' + port)
}
