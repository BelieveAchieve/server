const express = require('express')
const passport = require('passport')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
const { findKey } = require('lodash')

const authPassport = require('./passport')

const VerificationCtrl = require('../../controllers/VerificationCtrl')
const ResetPasswordCtrl = require('../../controllers/ResetPasswordCtrl')

const MailService = require('../../services/MailService')

const config = require('../../config.js')
const User = require('../../models/User.js')
const School = require('../../models/School.js')
const UserActionCtrl = require('../../controllers/UserActionCtrl')

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
      res.json({ user: req.user })
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

  router.post('/register', async function(req, res, next) {
    const isVolunteer = req.body.isVolunteer
    const email = req.body.email
    const password = req.body.password
    const code = req.body.code
    const volunteerPartnerOrg = req.body.volunteerPartnerOrg
    const studentPartnerOrg = req.body.studentPartnerOrg
    const partnerUserId = req.body.partnerUserId
    const highSchoolUpchieveId = req.body.highSchoolId
    const zipCode = req.body.zipCode
    const college = req.body.college
    const phone = req.body.phone
    const favoriteAcademicSubject = req.body.favoriteAcademicSubject
    const firstName = req.body.firstName.trim()
    const lastName = req.body.lastName.trim()
    const terms = req.body.terms
    const referredByCode = req.body.referredByCode

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

    const isStudentPartnerSignup =
      !isVolunteer && !highSchoolUpchieveId && !zipCode

    // Student partner org check (if no high school or zip code provided)
    if (isStudentPartnerSignup) {
      const allStudentPartnerManifests = config.studentPartnerManifests
      const studentPartnerManifest =
        allStudentPartnerManifests[studentPartnerOrg]

      if (!studentPartnerManifest) {
        return res.status(422).json({
          err: 'Invalid student partner organization'
        })
      }
    }

    // Volunteer partner org check (if no signup code provided)
    if (isVolunteer && !code) {
      const allVolunteerPartnerManifests = config.volunteerPartnerManifests
      const volunteerPartnerManifest =
        allVolunteerPartnerManifests[volunteerPartnerOrg]

      if (!volunteerPartnerManifest) {
        return res.status(422).json({
          err: 'Invalid volunteer partner organization'
        })
      }

      const volunteerPartnerDomains =
        volunteerPartnerManifest.requiredEmailDomains

      // Confirm email has one of volunteer partner's required domains
      if (volunteerPartnerDomains && volunteerPartnerDomains.length) {
        const userEmailDomain = email.split('@')[1]
        if (volunteerPartnerDomains.indexOf(userEmailDomain) === -1) {
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

    const highSchoolProvided = !!highSchoolUpchieveId
    const highSchoolApprovalRequired = !studentPartnerOrg && !zipCode

    // Look up high school
    const highschoolLookupPromise = new Promise((resolve, reject) => {
      if (isVolunteer) {
        // don't look up high schools for volunteers
        return resolve({
          isVolunteer: true
        })
      } else if (!highSchoolProvided) {
        // Don't look up high school for students who didn't provide one (it's not required for certain partner orgs)
        return resolve({
          isVolunteer: false
        })
      }

      School.findByUpchieveId(highSchoolUpchieveId, (err, school) => {
        if (err) {
          return reject(err)
        } else if (!highSchoolApprovalRequired) {
          // Don't require valid high school for students referred from partner or with eligible zip code
          return resolve({
            isVolunteer: false,
            school
          })
        } else if (highSchoolApprovalRequired && !school.isApproved) {
          return reject(
            new Error(`School ${highSchoolUpchieveId} is not approved`)
          )
        } else {
          return resolve({
            isVolunteer: false,
            school
          })
        }
      })
    })

    let referredById

    if (referredByCode) {
      try {
        const referredBy = await User.findOne({ referralCode: referredByCode })
          .select('_id')
          .lean()
          .exec()

        referredById = referredBy._id
      } catch (error) {
        Sentry.captureException(error)
      }
    }

    highschoolLookupPromise
      .then(({ isVolunteer, school }) => {
        const user = new User()
        user.email = email
        user.isVolunteer = isVolunteer
        user.registrationCode = code
        user.volunteerPartnerOrg = volunteerPartnerOrg
        user.studentPartnerOrg = studentPartnerOrg
        user.partnerUserId = partnerUserId
        user.approvedHighschool = school
        user.zipCode = zipCode
        user.college = college
        user.phonePretty = phone
        user.favoriteAcademicSubject = favoriteAcademicSubject
        user.firstname = firstName
        user.lastname = lastName
        user.verified = !isVolunteer // Currently only volunteers need to verify their email
        user.referralCode = base64url(Buffer.from(user.id, 'hex'))
        user.referredBy = referredById

        user.hashPassword(password, function(err, hash) {
          user.password = hash // Note the salt is embedded in the final hash

          if (err) {
            return next(err)
          }

          user.save(function(err) {
            if (err) {
              next(err)
            } else {
              req.login(user, function(err) {
                if (err) {
                  return next(err)
                }

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
                      if (err) {
                        Sentry.captureException(err)
                      }
                    }
                  )
                }

                UserActionCtrl.createdAccount(user._id).catch(error =>
                  Sentry.captureException(error)
                )

                return res.json({
                  user: user
                })
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

  router.get('/partner/student', function(req, res) {
    const studentPartnerId = req.query.partnerId

    if (!studentPartnerId) {
      return res.status(422).json({
        err: 'Missing studentPartnerId query string'
      })
    }

    const allStudentPartnerManifests = config.studentPartnerManifests

    if (!allStudentPartnerManifests) {
      return res.status(422).json({
        err: 'Missing studentPartnerManifests in config'
      })
    }

    const partnerManifest = allStudentPartnerManifests[studentPartnerId]

    if (!partnerManifest) {
      return res.status(404).json({
        err: `No manifest found for studentPartnerId "${studentPartnerId}"`
      })
    }

    return res.json({ studentPartner: partnerManifest })
  })

  router.get('/partner/student/code', function(req, res) {
    const partnerSignupCode = req.query.partnerSignupCode

    if (!partnerSignupCode) {
      return res.status(422).json({
        err: 'Missing partnerSignupCode query string'
      })
    }

    const allStudentPartnerManifests = config.studentPartnerManifests

    if (!allStudentPartnerManifests) {
      return res.status(422).json({
        err: 'Missing studentPartnerManifests in config'
      })
    }

    const studentPartnerKey = findKey(allStudentPartnerManifests, {
      signupCode: partnerSignupCode.toUpperCase()
    })

    if (!studentPartnerKey) {
      return res.status(404).json({
        err: `No partner key found for partnerSignupCode "${partnerSignupCode}"`
      })
    }

    return res.json({ studentPartnerKey })
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

  // List all valid registration codes (admins only)
  router
    .route('/register/volunteercodes')
    .all(authPassport.isAdmin)
    .get(function(req, res, next) {
      res.json({
        volunteerCodes: config.VOLUNTEER_CODES.split(',')
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
    const checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
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

  router.post('/reset/verify', async (req, res, next) => {
    const { token } = req.body

    if (!token.match(/^[a-f0-9]{32}$/)) {
      return res.status(422).json({
        err:
          'Please verify that this URL matches the link that was sent to your inbox.'
      })
    }

    try {
      const user = await User.findOne({ passwordResetToken: token })

      if (!user) {
        res.status(404).json({
          err:
            'This URL is no longer valid. Please check your inbox for the most recent password reset request email.'
        })
      } else {
        res.sendStatus(204)
      }
    } catch (err) {
      next(err)
    }
  })

  app.use('/auth', router)
}
