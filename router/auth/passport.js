var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var User = require('../../models/User.js')

passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function (email, password, done) {
  User.findOne({ email: email }, function (err, user) {
    if (err) {
      return done(err)
    }
    if (!user) {
      return done(null, false)
    }

    user.verifyPassword(password, function (err, user) {
      return done(err, user)
    })
  })
}
))

/**
 * Login Required middleware.
 */
exports.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  return res.status(401).json({ err: 'Not authenticated' })
}
