var Q = require('q');

var Session = require('../models/Session');
var twilio = require('../services/twilioNotification');

// A socket session tracks a session with its users and sockets
var SocketSession = function(options){
  this.session = options.session;
  this.users = []; // [User]
  this.sockets = {}; // userId => socket
};

// Add a socket and user to the session. If the user already has a socket, disconnect and replace it
SocketSession.prototype.join = function(options){
  var user = options.user,
      socket = options.socket;

  var userIndex = this.users.findIndex(function(joinedUser){
    return joinedUser._id === user._id
  });

  if (userIndex !== -1){
    var socket = this.sockets[user._id];
    if (socket){
      socket.disconnect(0);
    }
    this.users.splice(userIndex, 1);
  }

  this.users.push(user);
  this.sockets[user._id] = socket;

};

SocketSession.prototype.leave = function(socket){
  var userId;

  Object.keys(this.sockets).some(function(socketUserId){
    if (this.sockets[socketUserId] === socket){
      userId = socketUserId;
      return true;
    }
  }, this);

  console.log('User', userId, 'leaving from', this.session._id);

  var userIndex = this.users.findIndex(function(joinedUser){
    return joinedUser._id === userId
  });

  if (userIndex !== -1){
    this.users.splice(userIndex, 1);
  }

  delete this.sockets[userId];
};

SocketSession.prototype.hasSocket = function(socket){
  return Object.keys(this.sockets).some(function(userId){
    return this.sockets[userId] === socket
  }, this);
};

SocketSession.prototype.isDead = function(){
  return this.users.length === 0;
};

var SessionManager = function(){
  this._sessions = {}; // id => SocketSession
};

SessionManager.prototype.connect = function(options){
  var session = options.session
      user = options.user,
      socket = options.socket;
      console.log('connect');
  var socketSession = this._sessions[session._id];
  if (!socketSession){
    socketSession = new SocketSession({
      session: session
    });
    this._sessions[session._id] = socketSession
  } else {
    socketSession.session = session;
  }
  socketSession.join({
    user: user,
    socket: socket
  });
}

SessionManager.prototype.disconnect = function(options){
  var socket = options.socket;
  console.log('disconnect');
  var socketSession,
      session;
  Object.keys(this._sessions).some(function(sessionId){
    var s = this._sessions[sessionId];
    if (s.hasSocket(socket)){
      socketSession = s;
      return true;
    }
  }, this);

  if (socketSession){
    session = socketSession.session;
    socketSession.leave(socket);
  } else {
    console.log('!!! no socketSession found on disconnect')
  }

  return session;
}

// A dead session is a session with no connected to it
SessionManager.prototype.pruneDeadSessions = function(){

  var activeSessions = Object.keys(this._sessions)
    // Filter out inactive sessionIds
    .filter(function(sessionId){
      var socketSession = this._sessions[sessionId]
      console.log(socketSession.session._id, 'socketSession.isDead() => ', socketSession.isDead())
      return !socketSession.isDead();
    }, this)
    .map(function(activeSessionId){
      return this._sessions[activeSessionId];
    }, this);

  this._sessions = activeSessions;
};

SessionManager.prototype.list = function(){
  var sessions = this._sessions;
  return Object.keys(sessions).map(function(id){
    console.log(sessions[id].session);
    return sessions[id].session;
  });
};

SessionManager.prototype.getById = function(sessionId){
  return this._sessions[sessionId];
};

SessionManager.prototype.getUserBySocket = function(socket){
  var socketSession;
  Object.keys(this._sessions).some(function(sessionId){
    var s = this._sessions[sessionId];
    if (s.hasSocket(socket)){
      socketSession = s;
      return true;
    }
  }, this);

  if (!socketSession){
    return false;
  }

  var userId;
  Object.keys(socketSession.sockets).some(function(joinedUserId){
    if (socketSession.sockets[joinedUserId] === socket){
      userId = joinedUserId;
      return true;
    }
  });

  var userIndex = socketSession.users.findIndex(function(joinedUser){
    return joinedUser._id === userId
  });

  return socketSession.users[userIndex];
};

var sessionManager = new SessionManager();

module.exports = {

  create: function(options, cb){
    var user = options.user || {},
        userId = user._id,
        type = options.type;


    if (!userId){
      cb('Cannot create a session without a user id', null);
    } else if (user.isVolunteer){
      cb('Volunteers cannot create new sessions', null);
    } else if (!type){
      cb('Must provide a type for a new session', null);
    }

    var session = new Session({
      student: userId,
      type: type
    });
    console.log('create');
    twilio.notifyOnSession();
    session.save(cb);
  },

  get: function(options, cb){
    var sessionId = options.sessionId;
    console.log('get');
    var activeSession = sessionManager.getById(sessionId);
    if (activeSession){
      cb(null, activeSession.session);
    } else {
      Session.findOne({ _id: sessionId }, cb);
    }
  },

  // Return all current socket sessions as array
  getSocketSessions: function(){
    return sessionManager.list();
  },

  // Given a sessionId, create a socket session and join the session
  joinSession: function(options, cb){
    var sessionId = options.sessionId,
        user = options.user,
        socket = options.socket;

    Session.findOne({ _id: sessionId }, function(err, session){
      if (err){
        return cb(err)
      } else if (!session){
        return cb('No session found!');
      }

      session.joinUser(user, function(err, savedSession){
        if (err){
          sessionManager.disconnect({
            socket: socket
          });
        }
        Session.populate(savedSession, 'student volunteer', function(err, populatedSession){
          sessionManager.connect({
            session: session,
            user: user,
            socket: socket
          });
          cb(err, populatedSession);
        });
      });
    });
  },

  leaveSession: function(options, cb){
    var socket = options.socket;
    console.log('leave');
    var user = sessionManager.getUserBySocket(socket);

    var session = sessionManager.disconnect({
      socket: socket
    });

    sessionManager.pruneDeadSessions();

    if (user){
      session.leaveUser(user, cb);
    } else {
      cb(null, session);
    }
  },

  // Get list of all sessions that are not ended, with recent activity
  getRecentSessions: function(){

  }
};
