var path = require('path')

module.exports = function (app) {
  console.log('Initializing server routing')

  const sessionStore = require('./auth/session-store')(app)

  require('./auth')(app)
  require('./api')(app, sessionStore)
  require('./edu')(app)
  require('./school')(app)
  require('./twiml')(app)
  require('./contact')(app)

  // Determine if incoming request is a static asset
  var isStaticReq = function (req) {
    return ['/auth', '/api', '/school', '/twiml', 'contact', '/js', '/css'].some(function (whitelist) {
      return req.url.substr(0, whitelist.length) === whitelist
    })
  }

  // Single page app routing
  app.use(function (req, res, next) {
    if (isStaticReq(req)) {
      return next()
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}
