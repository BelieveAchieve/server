const express = require('express')
const passport = require('../auth/passport')
const addLastActivity = require('../../middleware/add-last-activity')
const addUserAction = require('../../middleware/add-user-action')

module.exports = function(app, sessionStore) {
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

  app.use(addLastActivity)
  app.use(addUserAction)
  app.use('/api', passport.isAuthenticated, router)
}
