const session = require('express-session')
const MongoStore = require('connect-mongo')(session)

const config = require('../../config')

module.exports = function(app) {
  const sessionStore = new MongoStore({
    url: config.database,
    collection: 'auth-sessions'
  })

  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: config.sessionSecret,
      store: sessionStore,
      cookie: {
        httpOnly: false,
        maxAge: config.sessionCookieMaxAge
      }
    })
  )

  return sessionStore
}
