var express = require('express')
var passport = require('../auth/passport')

module.exports = function (app) {
  console.log('API module')

  var router = new express.Router()
  require('./volunteers')(router)
  require('./user')(router)
  require('./verify')(router)
  require('./session')(router)
  require('./calendar')(router)
  require('./training')(router)
  require('./complete')(router)
  require('./feedback')(router)
  require('./sockets')(app)
  require('./moderate')(router)

  app.use('/api', passport.isAuthenticated, router)
}
