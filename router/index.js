var path = require('path')

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

  // True if incoming request is either a static asset or API request
  var isServerReq = function(req) {
    return [
      '/whiteboard',
      '/auth',
      '/api',
      '/api-public',
      '/metrics',
      '/twiml',
      '/mobile',
      '/js',
      '/css'
    ].some(function(whitelist) {
      return req.url.substr(0, whitelist.length) === whitelist
    })
  }

  // Single page app routing
  app.use(function(req, res, next) {
    if (isServerReq(req)) {
      return next()
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}
