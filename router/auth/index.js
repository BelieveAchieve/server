var express = require('express')
var session = require('express-session')
var flash = require('express-flash')
var passport = require('passport')
var MongoStore = require('connect-mongo')(session)

var VerificationCtrl = require('../../controllers/VerificationCtrl')
var ResetPasswordCtrl = require('../../controllers/ResetPasswordCtrl')

var config = require('../../config.js')
var User = require('../../models/User.js')

function checkPassword (password) {
  if (password.length < 8) {
    return 'Password must be 8 characters or longer'
  }

  var numUpper = 0
  var numLower = 0
  var numNumber = 0
  for (var i = 0; i < password.length; i++) {
    if (!isNaN(password[i])) {
      numNumber += 1
    } else if (password[i].toUpperCase() === password[i]) {
      numUpper += 1
    } else if (password[i].toLowerCase() === password[i]) {
      numLower += 1
    }
  }

  if (numUpper === 0) {
    return 'Password must contain at least one uppercase letter'
  }
  if (numLower === 0) {
    return 'Password must contain at least one lowercase letter'
  }
  if (numNumber === 0) {
    return 'Password must contain at least one number'
  }
  return true
}

module.exports = function (app) {
  console.log('Auth module')

  require('./passport')

  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: config.sessionSecret,
      store: new MongoStore({
        url: config.database,
        autoReconnect: true,
        collection: 'auth-sessions'
      }),
      cookie: {
        httpOnly: false
      }
    })
  )
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(flash())

  var router = new express.Router()

  router.get('/logout', function (req, res) {
    req.logout()
    res.json({
      msg: 'You have been logged out'
    })
  })

  router.post(
    '/login',
    passport.authenticate('local'), // Delegate auth logic to passport middleware
    function (req, res) {
      // If successfully authed, return user object (otherwise 401 is returned from middleware)
      res.json({
        user: req.user
      })
    }
  )

  router.post('/register/checkcred', function (req, res) {
    var email = req.body.email

    var password = req.body.password

    if (!email || !password) {
      return res.json({
        err: 'Must supply an email and password for registration'
      })
    }

    // Verify password for registration
    let checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.json({
        err: checkResult
      })
    }

    User.find({ email: email }, function (req, users) {
      if (users.length === 0) {
        return res.json({
          checked: true
        })
      } else {
        return res.json({
          err: 'The email address you entered is already in use'
        })
      }
    })
  })

  router.post('/register', function (req, res) {
    var email = req.body.email

    var password = req.body.password

    var code = req.body.code

    var highSchool = req.body.highSchool

    var firstName = req.body.firstName

    var lastName = req.body.lastName

    if (!email || !password) {
      return res.json({
        err: 'Must supply an email and password for registration'
      })
    }

    // Verify password for registration
    let checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.json({
        err: checkResult
      })
    }

    var user = new User()
    user.email = email
    user.isVolunteer = !(code === undefined)
    user.registrationCode = code
    user.highschool = highSchool
    user.firstname = firstName
    user.lastname = lastName
    user.verified = code === undefined

    user.hashPassword(password, function (err, hash) {
      user.password = hash // Note the salt is embedded in the final hash

      if (err) {
        res.json({
          err: 'Could not hash password'
        })
        return
      }

      user.save(function (err) {
        if (err) {
          res.json({
            err: err.message
          })
        } else {
          req.login(user, function (err) {
            if (err) {
              console.log(err)
              res.json({
                // msg: msg,
                err: err
              })
            } else {
              if (user.isVolunteer) {
                VerificationCtrl.initiateVerification(
                  {
                    userId: user._id,
                    email: user.email
                  },
                  function (err, email) {
                    var msg
                    if (err) {
                      msg =
                        'Registration successful. Error sending verification email: ' +
                        err
                    } else {
                      msg =
                        'Registration successful. Verification email sent to ' +
                        email
                    }

                    req.login(user, function (err) {
                      if (err) {
                        res.json({
                          msg: msg,
                          err: err
                        })
                      } else {
                        res.json({
                          msg: msg,
                          user: user
                        })
                      }
                    })
                  }
                )
              } else {
                res.json({
                  // msg: msg,
                  user: user
                })
              }
            }
          })
        }
      })
    })
  })

  router.post('/register/check', function (req, res) {
    var code = req.body.code
    console.log(code)
    if (!code) {
      res.json({
        err: 'No registration code given'
      })
      return
    }
    User.checkCode(code, function (err, data) {
      if (err) {
        res.json({
          err: err
        })
      } else {
        res.json({
          valid: data.studentCode || data.volunteerCode
        })
      }
    })
  })

  router.post('/reset/send', function (req, res) {
    var email = req.body.email
    if (!email) {
      return res.json({
        err: 'Must supply an email for password reset'
      })
    }
    ResetPasswordCtrl.initiateReset(
      {
        email: email
      },
      function (err, data) {
        if (err) {
          res.json({
            err: err
          })
        } else {
          res.json({
            msg: 'Password reset email sent'
          })
        }
      }
    )
  })

  router.post('/reset/confirm', function (req, res) {
    var email = req.body.email

    var password = req.body.password

    var newpassword = req.body.newpassword

    var token = req.body.token

    if (!token) {
      return res.json({
        err: 'No password reset token given'
      })
    } else if (!email || !password) {
      return res.json({
        err: 'Must supply an email and password for password reset'
      })
    } else if (!newpassword) {
      return res.json({
        err: 'Must reenter password for password reset'
      })
    } else if (newpassword !== password) {
      return res.json({
        err: 'Passwords do not match'
      })
    }

    // Verify password for password reset
    if (password.length < 8) {
      return res.json({
        err: 'Password must be 8 characters or longer'
      })
    }

    var numUpper = 0
    var numLower = 0
    var numNumber = 0
    for (var i = 0; i < password.length; i++) {
      if (!isNaN(password[i])) {
        numNumber += 1
      } else if (password[i].toUpperCase() === password[i]) {
        numUpper += 1
      } else if (password[i].toLowerCase() === password[i]) {
        numLower += 1
      }
    }

    if (numUpper === 0) {
      return res.json({
        err: 'Password must contain at least one uppercase letter'
      })
    }
    if (numLower === 0) {
      return res.json({
        err: 'Password must contain at least one lowercase letter'
      })
    }
    if (numNumber === 0) {
      return res.json({
        err: 'Password must contain at least one number'
      })
    }

    ResetPasswordCtrl.finishReset(
      {
        token: token,
        email: email
      },
      function (err, user) {
        if (err) {
          res.json({
            err: err
          })
        } else {
          user.hashPassword(password, function (err, hash) {
            if (err) {
              res.json({
                err: 'Could not hash password'
              })
            } else {
              user.password = hash // Note the salt is embedded in the final hash
              user.save(function (err) {
                if (err) {
                  return res.json({
                    err: 'Could not save user'
                  })
                }
                return res.json({
                  user: user
                })
              })
            }
          })
        }
      }
    )
  })

  app.use('/auth', router)
}
