var Session = require('../models/Session')
var User = require('../models/User')
var twilioService = require('../services/twilio')

var config = require('../config')

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

  let oldSocket
  if (userIndex !== -1) {
    oldSocket = this.sockets[user._id]

    this.users.splice(userIndex, 1)
  }

  this.users.push(user)
  this.sockets[user._id] = socket

  // try to prevent disconnecting the user if the new socket is
  // the same as the old one
  if (oldSocket && oldSocket.id !== socket.id) {
    oldSocket.disconnect(0)
  }
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

// A NewSessionTimeout keeps track of timeouts for notifications that need
// to be sent
var NewSessionTimeout = function (session, ...timeouts) {
  this.session = session
  this.timeouts = timeouts
}

NewSessionTimeout.prototype.clearTimeouts = function () {
  this.timeouts.forEach((timeout) => clearTimeout(timeout))
}

// remove a timeout from the session with which it is associated
NewSessionTimeout.prototype.removeTimeout = function (timeout) {
  const timeoutIndex = this.timeouts.findIndex(t => timeout === t)
  if (timeoutIndex > -1) {
    this.timeouts.splice(timeoutIndex, 1)
  }
}

// checks if a session has no timeouts
NewSessionTimeout.prototype.hasNoTimeouts = function () {
  return this.timeouts.length === 0
}

// The NewSessionTimekeeper manages timing of notifications that are
// triggered by sessions that are created but never joined by volunteers
var NewSessionTimekeeper = function () {
  this._newSessionTimeouts = {} // sessionId => newSessionTimeout
}

// set a timeout for a session that can be cancelled if a volunteer joins
NewSessionTimekeeper.prototype.setSessionTimeout = function (session, delay, cb, ...args) {
  const timeout = setTimeout((...a) => {
    cb(...a)

    // remove the timeout from memory after callback executes
    const newSessionTimeout = this._newSessionTimeouts[session._id]
    newSessionTimeout.removeTimeout(timeout)

    // delete the NewSessionTimeout object if there are no remaining timeouts
    if (newSessionTimeout.hasNoTimeouts()) {
      delete this._newSessionTimeouts[session._id]
    }
  }, delay, ...args)

  var newSessionTimeout = this._newSessionTimeouts[session._id]
  if (!newSessionTimeout) {
    // create the object
    newSessionTimeout = new NewSessionTimeout(session, timeout)
    this._newSessionTimeouts[session._id] = newSessionTimeout
  } else {
    // add timeout to existing object
    newSessionTimeout.timeouts.push(timeout)
  }
}

// clear all timeouts for a session
NewSessionTimekeeper.prototype.clearSessionTimeouts = function (session) {
  const newSessionTimeout = this._newSessionTimeouts[session._id]

  if (newSessionTimeout) {
    newSessionTimeout.clearTimeouts()
    delete this._newSessionTimeouts[session._id]
  }
}

var newSessionTimekeeper = new NewSessionTimekeeper()

function addSession (user, session) {
  User.update({ _id: user._id },
    { $addToSet: { pastSessions: session._id } },
    function (err, results) {
      if (err) {
        throw err
      } else {
        // print out what session was added to which user
        if (results.nModified === 1) {
          console.log(`${session._id} session was added to ` +
          `${user._id}'s pastSessions`)
        }
      }
    })
}

module.exports = {
  create: function (options, cb) {
    var user = options.user || {}
    var userId = user._id
    var type = options.type
    var subTopic = options.subTopic

    if (!userId) {
      return cb('Cannot create a session without a user id', null)
    } else if (user.isVolunteer) {
      return cb('Volunteers cannot create new sessions', null)
    } else if (!type) {
      return cb('Must provide a type for a new session', null)
    }

    var session = new Session({
      student: userId,
      type: type,
      subTopic: subTopic
    })

    // notify both available and failsafe volunteers
    twilioService.notify(user, type, subTopic, { isTestUserRequest: user.isTestUser })

    // second SMS failsafe notifications
    newSessionTimekeeper.setSessionTimeout(session, config.desperateSMSTimeout,
      twilioService.notifyFailsafe, user, type, subTopic, { desperate: true, isTestUserRequest: user.isTestUser })

    // failsafe voice notification
    newSessionTimekeeper.setSessionTimeout(session, config.desperateVoiceTimeout,
      twilioService.notifyFailsafe, user, type, subTopic,
      { desperate: true, voice: true, isTestUserRequest: user.isTestUser })

    session.save(cb)
  },

  end: function (options, cb) {
    var user = options.user
    var self = this

    this.get(options, function (err, session) {
      if (err) {
        return cb(err)
      } else if (!session) {
        return cb('No session found')
      } else if (self.isNotSessionParticipant(session, user)) {
        return cb('User is not a session participant')
      }

      // Session has already ended (the other user ended it)
      if (session.endedAt) {
        return cb(null, session)
      }

      var student = session.student
      var volunteer = session.volunteer
      // add session to the student and volunteer's pastSessions
      addSession(student, session)
      if (volunteer) {
        addSession(volunteer, session)
      }

      // clear timeouts
      newSessionTimekeeper.clearSessionTimeouts(session)

      session.endSession()
      cb(null, session)
    })
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
      .populate('student volunteer')
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
          cb(err)
          return
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

          if (user.isVolunteer) {
            newSessionTimekeeper.clearSessionTimeouts(session)
          }

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
  },

  // helpers
  isNotSessionParticipant: function (session, user) {
    const sessionParticipants = [
      session.volunteer || { _id: '' },
      session.student || { _id: '' }
    ]
    console.log('Session participants: ')
    console.log(sessionParticipants.map(e => e._id.toString()))

    return sessionParticipants.findIndex(
      participant => participant._id.toString() === user._id.toString()
    ) === -1
  },

  verifySessionParticipantBySessionId: function (sessionId, user, cb) {
    const self = this

    this.get({
      sessionId: sessionId
    }, function (err, session) {
      if (err) {
        cb(err)
      } else if (!user) {
        cb('This action requires a user ID')
      } else if (self.isNotSessionParticipant(session, user)) {
        cb('Only session participants can perform this action')
      } else {
        cb(null, session)
      }
    })
  }
}
