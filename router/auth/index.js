const express = require('express')
const passport = require('passport')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
const { findKey } = require('lodash')
const { capitalize } = require('lodash')
const VerificationCtrl = require('../../controllers/VerificationCtrl')
const ResetPasswordCtrl = require('../../controllers/ResetPasswordCtrl')
const MailService = require('../../services/MailService')
const IpAddressService = require('../../services/IpAddressService')
const config = require('../../config')
const User = require('../../models/User')
const Student = require('../../models/Student')
const Volunteer = require('../../models/Volunteer')
const School = require('../../models/School.js')
const UserActionCtrl = require('../../controllers/UserActionCtrl')
const { USER_BAN_REASON } = require('../../constants')
const authPassport = require('./passport')
const UserCtrl = require('../../controllers/UserCtrl')

// Validation functions
function checkPassword(password) {
  if (password.length < 8) {
    return 'Password must be 8 characters or longer'
  }

  let numUpper = 0
  let numLower = 0
  let numNumber = 0
  for (let i = 0; i < password.length; i++) {
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

  const router = new express.Router()

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
    const email = req.body.email

    const password = req.body.password

    if (!email || !password) {
      return res.status(422).json({
        err: 'Must supply an email and password for registration'
      })
    }

    // Verify password for registration
    const checkResult = checkPassword(password)
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

  router.post('/register/student', async function(req, res, next) {
    const { ip } = req
    const {
      email,
      password,
      studentPartnerOrg,
      partnerUserId,
      highSchoolId: highSchoolUpchieveId,
      zipCode,
      terms,
      referredByCode,
      firstName,
      lastName
    } = req.body

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

    // Verify password for registration
    const checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
      })
    }

    const isStudentPartnerSignup = !highSchoolUpchieveId && !zipCode

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

    const highSchoolProvided = !!highSchoolUpchieveId

    let school
    if (highSchoolProvided)
      school = await School.findByUpchieveId(highSchoolUpchieveId)

    const highSchoolApprovalRequired = !studentPartnerOrg && !zipCode
    if (highSchoolApprovalRequired && school && !school.isApproved)
      return res.status(422).json({
        err: `School ${highSchoolUpchieveId} is not approved`
      })

    const { country_code: countryCode } = await IpAddressService.getIpWhoIs(ip)
    let isBanned = false
    let banReason

    if (countryCode && countryCode !== 'US') {
      isBanned = true
      banReason = USER_BAN_REASON.NON_US_SIGNUP
    }

    const referredBy = await UserCtrl.checkReferral(referredByCode)
    const student = new Student({
      firstname: capitalize(firstName.trim()),
      lastname: capitalize(lastName.trim()),
      email,
      zipCode,
      studentPartnerOrg,
      partnerUserId,
      approvedHighschool: school,
      isVolunteer: false,
      verified: true, // Students are automatically verified
      referredBy,
      isBanned,
      banReason
    })
    student.referralCode = base64url(Buffer.from(student.id, 'hex'))

    try {
      student.password = await student.hashPassword(password)
      await student.save()
      await req.login(student)
    } catch (err) {
      Sentry.captureException(err)
      return next(err)
    }

    try {
      await MailService.sendStudentWelcomeEmail({
        email: student.email,
        firstName: student.firstname
      })
    } catch (err) {
      Sentry.captureException(err)
    }

    try {
      await UserActionCtrl.createdAccount(student._id, ip)
    } catch (err) {
      Sentry.captureException(err)
    }

    return res.json({
      user: student
    })
  })

  router.post('/register/volunteer', async function(req, res, next) {
    const {
      email,
      password,
      code,
      volunteerPartnerOrg,
      college,
      phone,
      favoriteAcademicSubject,
      terms,
      referredByCode,
      firstName,
      lastName
    } = req.body

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

    // Verify password for registration
    const checkResult = checkPassword(password)
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
      })
    }
 
    // Volunteer partner org check (if no signup code provided)
    if (!code) {
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

    const referredBy = await UserCtrl.checkReferral(referredByCode)

    const volunteer = new Volunteer({
      email,
      isVolunteer: true,
      registrationCode: code,
      volunteerPartnerOrg,
      college,
      phonePretty: phone,
      favoriteAcademicSubject,
      firstname: capitalize(firstName.trim()),
      lastname: capitalize(lastName.trim()),
      verified: false,
      referredBy
    });
    volunteer.referralCode = base64url(Buffer.from(volunteer.id, 'hex'))

    try {
      volunteer.password = await volunteer.hashPassword(password)
      await volunteer.save()
      await req.login(volunteer)
    } catch (err) {
      Sentry.captureException(err)
      return next(err)
    }

    // Send internal email alert if new volunteer is from a partner org
    if (volunteer.volunteerPartnerOrg) {
      MailService.sendPartnerOrgSignupAlert({
        name: `${volunteer.firstname} ${volunteer.lastname}`,
        email: volunteer.email,
        company: volunteerPartnerOrg,
        upchieveId: volunteer._id
      })
    }

    try {
      await VerificationCtrl.initiateVerification({ user: volunteer })
    } catch (err) {
      Sentry.captureException(err)
    }

    try {
      const { ip } = req
      await UserActionCtrl.createdAccount(volunteer._id, ip)
    } catch (err) {
      Sentry.captureException(err)
    }

    return res.json({
      user: volunteer
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

    const isVolunteerCode = Volunteer.checkCode(code)

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
    const email = req.body.email
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
    const email = req.body.email

    const password = req.body.password

    const newpassword = req.body.newpassword

    const token = req.body.token

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
