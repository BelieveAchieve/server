var express = require('express')
var passport = require('../auth/passport')
var User = require('../../models/User.js')

module.exports = function(app, sessionStore) {
  console.log('API module')

  const io = require('./socket-server')(app)

  const router = new express.Router()

  app.use(function(req, res, next) {
    if (req.user) {
      const { id, lastActivityAt } = req.user
      const todaysDateInMS = Date.now()
      const oneDayElapsed = 1000 * 60 * 60 * 24
      const lastActivityInMS = new Date(lastActivityAt).getTime()

      if (lastActivityInMS + oneDayElapsed <= todaysDateInMS) {
        const todaysDateFormatted = new Date(todaysDateInMS)
        User.updateOne({ _id: id }, { lastActivityAt: todaysDateFormatted })
          .then(() => next())
          .catch(err => next(err))
      } else {
        next()
      }
    } else {
      next()
    }
  })

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
