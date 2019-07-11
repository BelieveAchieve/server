var Session = require('../models/Session')
var twilioService = require('../services/twilio')

// A socket session tracks a session with its users and sockets
var SocketSession = function (options) {
  this.session = options.session
  this.users = [] // [User]
  this.sockets = {} // userId => socket
}

// Add a socket and user to the session. If the user already has a socket,
// disconnect and replace it
SocketSession.prototype.join = function (options) {
  var user = options.user
  var socket = options.socket
  var userIndex = this.users.findIndex(function (joinedUser) {
    return joinedUser._id === user._id
  })

  if (userIndex !== -1) {
    var oldSocket = this.sockets[user._id]
    // only disconnect the user if the new socket isn't the same as the old one
    if (oldSocket && oldSocket !== socket) {
      oldSocket.disconnect(0)
    }
    this.users.splice(userIndex, 1)
  }

  this.users.push(user)
  this.sockets[user._id] = socket
}

SocketSession.prototype.leave = function (socket) {
  var userId

  Object.keys(this.sockets).some(function (socketUserId) {
    if (this.sockets[socketUserId] === socket) {
      userId = socketUserId
      return true
    }
  }, this)

  console.log('User', userId, 'leaving from', this.session._id)

  var userIndex = this.users.findIndex(function (joinedUser) {
    return joinedUser._id === userId
  })

  if (userIndex !== -1) {
    this.users.splice(userIndex, 1)
  }

  delete this.sockets[userId]
}

SocketSession.prototype.hasSocket = function (socket) {
  return Object.keys(this.sockets).some(function (userId) {
    return this.sockets[userId] === socket
  }, this)
}

SocketSession.prototype.isDead = function () {
  return this.users.length === 0
}

var SessionManager = function () {
  this._sessions = {} // id => SocketSession
}

SessionManager.prototype.connect = function (options) {
  const session = options.session
  const user = options.user
  const socket = options.socket
  let socketSession = this._sessions[session._id]

  if (!socketSession) {
    socketSession = new SocketSession({
      session: session
    })
    this._sessions[session._id] = socketSession
  } else {
    socketSession.session = session
  }

  socketSession.join({
    user: user,
    socket: socket
  })
}

SessionManager.prototype.disconnect = function (options) {
  var socket = options.socket

  var socketSession, session
  Object.keys(this._sessions).some(function (sessionId) {
    console.log(`sessionid: ${sessionId}`)
    var s = this._sessions[sessionId]
    if (s.hasSocket(socket)) {
      socketSession = s
      return true
    }
  }, this)

  if (socketSession) {
    session = socketSession.session
    socketSession.leave(socket)
  } else {
    console.log('!!! no socketSession found on disconnect')
  }

  return session
}

// Delete any SocketSessions that are dead.
// A dead session is a session with no users connected to it.
//
// Return a reference to the SocketSession instance.
SessionManager.prototype.pruneDeadSessions = function () {
  if (!this._sessions) {
    return this
  }

  const sessionIds = Object.keys(this._sessions)
  const deadSessionIds = sessionIds.filter(sessionId =>
    this._sessions[sessionId].isDead()
  )

  deadSessionIds.forEach(sessionId => delete this._sessions[sessionId])

  return this
}

SessionManager.prototype.list = function () {
  var sessions = this._sessions
  return Object.keys(sessions).map(function (id) {
    return sessions[id].session
  })
}

SessionManager.prototype.getById = function (sessionId) {
  return this._sessions[sessionId]
}

SessionManager.prototype.getUserBySocket = function (socket) {
  var socketSession
  Object.keys(this._sessions).some(function (sessionId) {
    var s = this._sessions[sessionId]
    if (s.hasSocket(socket)) {
      socketSession = s
      return true
    }
  }, this)

  if (!socketSession) {
    return false
  }

  var userId
  Object.keys(socketSession.sockets).some(function (joinedUserId) {
    if (socketSession.sockets[joinedUserId] === socket) {
      userId = joinedUserId
      return true
    }
  })

  var userIndex = socketSession.users.findIndex(function (joinedUser) {
    return joinedUser._id === userId
  })

  return socketSession.users[userIndex]
}

var sessionManager = new SessionManager()

module.exports = {
  create: function (options, cb) {
    var user = options.user || {}
    var userId = user._id
    var type = options.type
    var subTopic = options.subTopic

    if (!userId) {
      cb('Cannot create a session without a user id', null)
    } else if (user.isVolunteer) {
      cb('Volunteers cannot create new sessions', null)
    } else if (!type) {
      cb('Must provide a type for a new session', null)
    }

    var session = new Session({
      student: userId,
      type: type,
      subTopic: subTopic
    })

    if (!user.isTestUser) {
      twilioService.notify(type, subTopic)
    }

    session.save(cb)
  },

  get: function (options, cb) {
    var sessionId = options.sessionId

    var activeSession = sessionManager.getById(sessionId)
    if (activeSession) {
      cb(null, activeSession.session)
    } else {
      Session.findOne({ _id: sessionId }, cb)
    }
  },

  findLatest: function (attrs, cb) {
    Session.find(attrs)
      .sort({ createdAt: -1 })
      .limit(1)
      .findOne()
      .exec(cb)
  },

  // Return all current socket sessions as array
  getSocketSessions: function () {
    return sessionManager.list()
  },

  // Given a sessionId, create a socket session and join the session
  joinSession: function (options, cb) {
    var sessionId = options.sessionId
    var user = options.user
    var socket = options.socket

    Session.findOne({ _id: sessionId }, function (err, session) {
      if (err) {
        return cb(err)
      } else if (!session) {
        return cb('No session found!')
      }

      session.joinUser(user, function (err, savedSession) {
        if (err) {
          sessionManager.disconnect({
            socket: socket
          })
        }
        Session.populate(savedSession, 'student volunteer', function (
          err,
          populatedSession
        ) {
          sessionManager.connect({
            session: session,
            user: user,
            socket: socket
          })
          cb(err, populatedSession)
        })
      })
    })
  },

  leaveSession: function (options, cb) {
    var socket = options.socket
    var user = sessionManager.getUserBySocket(socket)
    var session = sessionManager.disconnect({
      socket: socket
    })

    sessionManager.pruneDeadSessions()

    if (user) {
      session.leaveUser(user, cb)
      session.user = user
      cb(null, session)
    } else {
      cb(null, session)
    }
  }
}
