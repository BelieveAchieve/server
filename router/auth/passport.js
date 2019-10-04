var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var User = require('../../models/User.js')

passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    if (err) {
      return done(err, user)
    }

    user.populate('pastSessions').execPopulate((err, populatedUser) => {
      done(err, populatedUser)
    })
  })
})

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    function (email, password, done) {
      User.findOne({ email: email }, '+password', function (err, user) {
        if (err) {
          return done(err)
        }
        if (!user) {
          return done(null, false)
        }

        user.verifyPassword(password, function (err, user) {
          if (err) {
            done(err)
          } else {
            // pass the user to the callback without the password hash
            user.password = undefined
            done(null, user)
          }
        })
      })
    }
  )
)

/**
 * Login Required middleware.
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  return res.status(401).json({ err: 'Not authenticated' })
}

const isAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next()
  }
  return res.status(401).json({ err: 'Unauthorized' })
}

const isAuthenticatedRedirect = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  return res.redirect('/')
}

const isAdminRedirect = (req, res, next) => {
  if (req.user.isAdmin) {
    return next()
  }
  return res.redirect('/')
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isAuthenticatedRedirect,
  isAdminRedirect
}
