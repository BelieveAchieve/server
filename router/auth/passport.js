const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../../models/User')

passport.serializeUser(function(user, done) {
  done(null, user._id)
})

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id).lean()
    if (!user) return done(new Error('no user found'))
    return done(null, user)
  } catch (error) {
    return done(error)
  }
})

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async function(email, passwordGiven, done) {
      try {
        const user = await User.findOne({ email: email }, '+password')
          .lean()
          .exec()

        if (!user) {
          return done(null, false)
        }

        const isValidPassword = await User.verifyPassword(
          passwordGiven,
          user.password
        )

        user.password = undefined

        if (isValidPassword) {
          return done(null, user)
        } else {
          return done(null, false)
        }
      } catch (error) {
        return done(error)
      }
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
