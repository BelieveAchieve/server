module.exports = function(app) {
  console.log('Initializing server routing')

  require('./whiteboard')(app)

  const sessionStore = require('./auth/session-store')(app)

  require('./auth')(app)
  require('./api')(app, sessionStore)
  require('./edu')(app)
  require('./eligibility')(app)
  require('./twiml')(app)
  require('./contact')(app)
  require('./metrics')(app)
  require('./mobile')(app)
  require('./reference')(app)

  app.get('/healthz', function(req, res) {
    res.sendStatus(200)
  })
}
