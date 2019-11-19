var express = require('express')
var passport = require('../auth/passport')

module.exports = function (app, sessionStore) {
  console.log('API module')

  const io = require('./socket-server')(app)

  const router = new express.Router()
  require('./volunteers')(router)
  require('./user')(router)
  require('./verify')(router)
  require('./session')(router, io)
  require('./calendar')(router)
  require('./training')(router)
  require('./feedback')(router)
  require('./sockets')(io, sessionStore)
  require('./moderate')(router)

  app.use('/api', passport.isAuthenticated, router)
}
