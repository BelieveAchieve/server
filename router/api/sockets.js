var http = require('http')
var https = require('https')
var socket = require('socket.io')
var fs = require('fs')

var config = require('../../config.js')
var SessionCtrl = require('../../controllers/SessionCtrl.js')

module.exports = function (app) {
  let server

  if (config.isProd()) {
    server = https.createServer(
      {
        key: fs.readFileSync(`${config.LETSENCRYPT_DIR}/privkey.pem`),
        cert: fs.readFileSync(`${config.LETSENCRYPT_DIR}/fullchain.pem`),
        ca: fs.readFileSync(`${config.LETSENCRYPT_DIR}/chain.pem`)
      },
      app
    )
  } else {
    server = http.createServer(app)
  }

  var io = socket(server)

  io.on('connection', function (socket) {
    // Session management
    socket.on('join', function (data) {
      if (!data || !data.sessionId) return
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
          } else {
            socket.join(data.sessionId)
            console.log('Session joined:', session._id)
            io.emit('sessions', SessionCtrl.getSocketSessions())
            io.to(session._id).emit('session-change', session)
          }
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

    socket.on('message', function (data) {
      if (!data.sessionId) return

      var message = {
        user: data.user,
        contents: data.message
      }

      SessionCtrl.get(
        {
          sessionId: data.sessionId
        },
        function (err, session) {
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

    socket.on('drawClick', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('draw', {
        x: data.x,
        y: data.y,
        type: data.type
      })
    })

    socket.on('saveImage', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('save')
    })

    socket.on('undoClick', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('undo')
    })

    socket.on('clearClick', function (data) {
      if (!data || !data.sessionId) return
      io.to(data.sessionId).emit('clear')
    })

    socket.on('drawing', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('draw')
    })

    socket.on('end', function (data) {
      if (!data || !data.sessionId) return

      SessionCtrl.get(
        {
          sessionId: data.sessionId
        },
        function (err, session) {
          session.saveWhiteboardUrl(data.whiteboardUrl)
          socket.broadcast.to(data.sessionId).emit('end', data)
        }
      )
    })

    socket.on('changeColor', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('color', data.color)
    })

    socket.on('changeWidth', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('width', data.width)
    })

    socket.on('dragStart', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('dstart', {
        x: data.x,
        y: data.y,
        color: data.color
      })
    })

    socket.on('dragAction', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('drag', {
        x: data.x,
        y: data.y,
        color: data.color
      })
    })

    socket.on('dragEnd', function (data) {
      if (!data || !data.sessionId) return
      socket.broadcast.to(data.sessionId).emit('dend', {
        x: data.x,
        y: data.y,
        color: data.color
      })
    })

    socket.on('insertText', function (data) {
      if (!data || !data.sessionId) return
      io.to(data.sessionId).emit('text', {
        text: data.text,
        x: data.x,
        y: data.y
      })
    })

    socket.on('resetScreen', function (data) {
      io.to(data.sessionId).emit('reset')
    })
  })

  var port = config.SOCKET_PORT
  server.listen(port)

  console.log('Sockets.io listening on port ' + port)
}
