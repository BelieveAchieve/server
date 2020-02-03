const express = require('express')
const flash = require('express-flash')
const passport = require('passport')
const Sentry = require('@sentry/node')

const VerificationCtrl = require('../../controllers/VerificationCtrl')
const ResetPasswordCtrl = require('../../controllers/ResetPasswordCtrl')

const MailService = require('../../services/MailService')

const config = require('../../config.js')
const User = require('../../models/User.js')
const School = require('../../models/School.js')

// Validation functions
function checkPassword(password) {
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

module.exports = function(app) {
  console.log('Auth module')

  require('./passport')

  app.use(passport.initialize())
  app.use(passport.session())
  app.use(flash())

  var router = new express.Router()

  router.get('/logout', function(req, res) {
    req.session.destroy()
    req.logout()
    res.json({
      msg: 'You have been logged out'
    })
  })

  router.post(
    '/login',
    passport.authenticate('local'), // Delegate auth logic to passport middleware
    function(req, res) {
      // If successfully authed, return user object (otherwise 401 is returned from middleware)
      res.json({
        user: req.user.parseProfile()
      })
    }
  )

  router.post('/register/checkcred', function(req, res) {
    var email = req.body.email

    var password = req.body.password

    if (!email || !password) {
      return res.status(422).json({
        err: 'Must supply an email and password for registration'
      })
    }

    // Verify password for registration
    let checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
      })
    }

    User.find({ email: email }, function(req, users) {
      if (users.length === 0) {
        return res.json({
          checked: true
        })
      } else {
        return res.status(409).json({
          err: 'The email address you entered is already in use'
        })
      }
    })
  })

  router.post('/register', function(req, res, next) {
    var isVolunteer = req.body.isVolunteer

    var email = req.body.email

    var password = req.body.password

    var code = req.body.code

    var volunteerPartnerOrg = req.body.volunteerPartnerOrg

    var highSchoolUpchieveId = req.body.highSchoolId

    var college = req.body.college

    var phone = req.body.phone

    var favoriteAcademicSubject = req.body.favoriteAcademicSubject

    var firstName = req.body.firstName.trim()

    var lastName = req.body.lastName.trim()

    var terms = req.body.terms

    if (!terms) {
      return res.status(422).json({
        err: 'Must accept the user agreement'
      })
    }

    if (!email || !password) {
      return res.status(422).json({
        err: 'Must supply an email and password for registration'
      })
    }

    // Volunteer partner org check
    if (isVolunteer && !code) {
      const allVolunteerPartnerManifests = config.volunteerPartnerManifests
      const partnerManifest = allVolunteerPartnerManifests[volunteerPartnerOrg]

      if (!partnerManifest) {
        return res.status(422).json({
          err: 'Invalid volunteer partner organization'
        })
      }

      const partnerOrgDomains = partnerManifest.requiredEmailDomains

      // Confirm email has one of partner org's required domains
      if (partnerOrgDomains && partnerOrgDomains.length) {
        const userEmailDomain = email.split('@')[1]
        if (partnerOrgDomains.indexOf(userEmailDomain) === -1) {
          return res.status(422).json({
            err: 'Invalid email domain for volunteer partner organization'
          })
        }
      }
    }

    // Verify password for registration
    let checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
      })
    }

    // Look up high school
    const promise = new Promise((resolve, reject) => {
      if (isVolunteer) {
        // don't look up high schools for volunteers
        resolve({
          isVolunteer: true
        })

        // early exit
        return
      }

      School.findByUpchieveId(highSchoolUpchieveId, (err, school) => {
        if (err) {
          reject(err)
        } else if (!school.isApproved) {
          reject(new Error(`School ${highSchoolUpchieveId} is not approved`))
        } else {
          resolve({
            isVolunteer: false,
            school
          })
        }
      })
    })

    promise
      .then(({ isVolunteer, school }) => {
        const user = new User()
        user.email = email
        user.isVolunteer = isVolunteer
        user.registrationCode = code
        user.volunteerPartnerOrg = volunteerPartnerOrg
        user.approvedHighschool = school
        user.college = college
        user.phonePretty = phone
        user.favoriteAcademicSubject = favoriteAcademicSubject
        user.firstname = firstName
        user.lastname = lastName
        user.verified = !isVolunteer // Currently only volunteers need to verify their email

        user.hashPassword(password, function(err, hash) {
          user.password = hash // Note the salt is embedded in the final hash

          if (err) {
            next(err)
            return
          }

          user.save(function(err) {
            if (err) {
              next(err)
            } else {
              req.login(user, function(err) {
                if (err) {
                  next(err)
                } else {
                  if (user.isVolunteer) {
                    // Send internal email alert if new volunteer is from a partner org
                    if (user.volunteerPartnerOrg) {
                      MailService.sendPartnerOrgSignupAlert({
                        name: `${user.firstname} ${user.lastname}`,
                        email: user.email,
                        company: volunteerPartnerOrg,
                        upchieveId: user._id
                      })
                    }

                    VerificationCtrl.initiateVerification(
                      {
                        userId: user._id,
                        email: user.email
                      },
                      function(err, email) {
                        var msg
                        if (err) {
                          msg =
                            'Registration successful. Error sending verification email: ' +
                            err
                          Sentry.captureException(err)
                        } else {
                          msg =
                            'Registration successful. Verification email sent to ' +
                            email
                        }

                        req.login(user, function(err) {
                          if (err) {
                            next(err)
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
      .catch(err => {
        next(err)
      })
  })

  router.get('/partner/volunteer', function(req, res) {
    const volunteerPartnerId = req.query.partnerId

    if (!volunteerPartnerId) {
      return res.status(422).json({
        err: 'Missing volunteerPartnerId query string'
      })
    }

    const allVolunteerPartnerManifests = config.volunteerPartnerManifests

    if (!allVolunteerPartnerManifests) {
      return res.status(422).json({
        err: 'Missing volunteerPartnerManifests in config'
      })
    }

    const partnerManifest = allVolunteerPartnerManifests[volunteerPartnerId]

    if (!partnerManifest) {
      return res.status(404).json({
        err: `No manifest found for volunteerPartnerId "${volunteerPartnerId}"`
      })
    }

    return res.json({ volunteerPartner: partnerManifest })
  })

  router.post('/register/check', function(req, res, next) {
    const code = req.body.code

    if (!code) {
      res.status(422).json({
        err: 'No registration code given'
      })
      return
    }

    const isVolunteerCode = User.checkCode(code)

    res.json({
      isValid: isVolunteerCode
    })
  })

  router.post('/reset/send', function(req, res, next) {
    var email = req.body.email
    if (!email) {
      return res.status(422).json({
        err: 'Must supply an email for password reset'
      })
    }
    ResetPasswordCtrl.initiateReset(
      {
        email: email
      },
      function(err, data) {
        if (err) {
          next(err)
        } else {
          res.json({
            msg: 'Password reset email sent'
          })
        }
      }
    )
  })

  router.post('/reset/confirm', function(req, res, next) {
    var email = req.body.email

    var password = req.body.password

    var newpassword = req.body.newpassword

    var token = req.body.token

    if (!token) {
      return res.status(422).json({
        err: 'No password reset token given'
      })
    } else if (!email || !password) {
      return res.status(422).json({
        err: 'Must supply an email and password for password reset'
      })
    } else if (!newpassword) {
      return res.status(422).json({
        err: 'Must reenter password for password reset'
      })
    } else if (newpassword !== password) {
      return res.status(422).json({
        err: 'Passwords do not match'
      })
    }

    // Verify password for password reset
    if (password.length < 8) {
      return res.status(422).json({
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
      return res.status(422).json({
        err: 'Password must contain at least one uppercase letter'
      })
    }
    if (numLower === 0) {
      return res.status(422).json({
        err: 'Password must contain at least one lowercase letter'
      })
    }
    if (numNumber === 0) {
      return res.status(422).json({
        err: 'Password must contain at least one number'
      })
    }

    ResetPasswordCtrl.finishReset(
      {
        token: token,
        email: email
      },
      function(err, user) {
        if (err) {
          next(err)
        } else {
          user.hashPassword(password, function(err, hash) {
            if (err) {
              next(err)
            } else {
              user.password = hash // Note the salt is embedded in the final hash
              user.save(function(err) {
                if (err) {
                  next(err)
                } else {
                  return res.json({
                    user: user
                  })
                }
              })
            }
          })
        }
      }
    )
  })

  app.use('/auth', router)
}
