const express = require('express')
const passport = require('passport')
const Sentry = require('@sentry/node')
const { findKey } = require('lodash')
const ResetPasswordCtrl = require('../../controllers/ResetPasswordCtrl')
const IpAddressService = require('../../services/IpAddressService')
const config = require('../../config')
const User = require('../../models/User')
const School = require('../../models/School.js')
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

  router.post('/register/student', async function(req, res) {
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
      lastName,
      college,
      partnerSite
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

    const {
      country_code: countryCode,
      org
    } = await IpAddressService.getIpWhoIs(ip)
    let isBanned = false
    let banReason

    if (config.bannedServiceProviders.includes(org)) {
      isBanned = true
      banReason = USER_BAN_REASON.BANNED_SERVICE_PROVIDER
    } else if (countryCode && countryCode !== 'US') {
      isBanned = true
      banReason = USER_BAN_REASON.NON_US_SIGNUP
    }

    const referredBy = await UserCtrl.checkReferral(referredByCode)
    const studentData = {
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      email,
      zipCode,
      studentPartnerOrg,
      partnerUserId,
      partnerSite,
      approvedHighschool: school,
      college,
      isVolunteer: false,
      verified: true, // Students are automatically verified
      referredBy,
      isBanned,
      banReason,
      password,
      ip
    }

    try {
      const student = await UserCtrl.createStudent(studentData)
      await req.login(student)
      return res.json({
        user: student
      })
    } catch (err) {
      Sentry.captureException(err)
      return res.status(422).json({ err: err.message })
    }
  })

  router.post('/register/volunteer/open', async function(req, res) {
    const { ip } = req
    const {
      email,
      password,
      phone,
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

    const referredBy = await UserCtrl.checkReferral(referredByCode)

    const volunteerData = {
      email,
      isVolunteer: true,
      isApproved: false,
      phone,
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      verified: false,
      referredBy,
      password,
      ip
    }

    try {
      const volunteer = await UserCtrl.createVolunteer(volunteerData)
      await req.login(volunteer)
      return res.json({
        user: volunteer
      })
    } catch (err) {
      Sentry.captureException(err)
      return res.status(422).json({ err: err.message })
    }
  })

  router.post('/register/volunteer/partner', async function(req, res) {
    const { ip } = req
    const {
      email,
      password,
      volunteerPartnerOrg,
      phone,
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

    // Volunteer partner org check
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

    const referredBy = await UserCtrl.checkReferral(referredByCode)

    const volunteerData = {
      email,
      isApproved: false,
      isVolunteer: true,
      volunteerPartnerOrg,
      phone,
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      verified: false,
      referredBy,
      password,
      ip
    }

    try {
      const volunteer = await UserCtrl.createVolunteer(volunteerData)
      await req.login(volunteer)
      return res.json({
        user: volunteer
      })
    } catch (err) {
      Sentry.captureException(err)
      return res.status(422).json({ err: err.message })
    }
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

  // List all student partners (admins only)
  router
    .route('/partner/student-partners')
    .all(authPassport.isAdmin)
    .get(function(req, res, next) {
      const partnerOrgs = []
      for (const [key, value] of Object.entries(
        config.studentPartnerManifests
      )) {
        partnerOrgs.push({
          key,
          displayName: value.name ? value.name : key,
          sites: value.sites ? value.sites : null
        })
      }
      return res.json({
        partnerOrgs
      })
    })

  // List all volunteer partners (admins only)
  router
    .route('/partner/volunteer-partners')
    .all(authPassport.isAdmin)
    .get(function(req, res, next) {
      const partnerOrgs = []
      for (const [key, value] of Object.entries(
        config.volunteerPartnerManifests
      )) {
        partnerOrgs.push({
          key,
          displayName: value.name ? value.name : key
        })
      }
      return res.json({
        partnerOrgs
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

  router.post('/reset/confirm', async function(req, res) {
    const { email, password, newpassword, token } = req.body

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

    try {
      await ResetPasswordCtrl.finishReset({
        email,
        password,
        token
      })
      return res.sendStatus(200)
    } catch (err) {
      res.status(500).json({
        err: err.message
      })
    }
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
