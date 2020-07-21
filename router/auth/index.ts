import express from 'express';
import passport from 'passport';
import Sentry from '@sentry/node';
import { findKey } from 'lodash';
import ResetPasswordCtrl from '../../controllers/ResetPasswordCtrl';
import IpAddressService from '../../services/IpAddressService';
import config from '../../config';
import User from '../../models/User';
import Volunteer from '../../models/Volunteer';
import School from '../../models/School.js';
import { USER_BAN_REASON } from '../../constants';
import UserCtrl from '../../controllers/UserCtrl';
import authPassport from './passport';
import * as register from './register';

module.exports = async function(app): Promise<void> {
  console.log('Auth module');

  require('./passport');

  app.use(passport.initialize());
  app.use(passport.session());

  const router = express.Router();

  router.get('/logout', function(req, res) {
    req.session.destroy();
    req.logout();
    res.json({
      msg: 'You have been logged out'
    });
  });

  router.post(
    '/login',
    passport.authenticate('local'), // Delegate auth logic to passport middleware
    function(req, res) {
      // If successfully authed, return user object (otherwise 401 is returned from middleware)
      res.json({ user: req.user });
    }
  );

  router.post('/register/checkcred', async function(req, res) {
    const email = req.body.email;

    const password = req.body.password;

    // Verify password, unique email
    const checkResult = await register.newCredentialsInvalid(
      password,
      email,
      res
    );
    if (checkResult) {
      return checkResult;
    }

    // All checks passed
    return res.json({ checked: true });
  });

  router.post('/register/student', async function(req, res) {
    const { ip } = req;
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
    } = req.body;
    if (!terms) {
      return res.status(422).json({
        err: 'Must accept the user agreement'
      });
    }
    // Verify password, unique email
    const checkResult = await register.newCredentialsInvalid(
      password,
      email,
      res
    );
    if (checkResult) {
      return checkResult;
    }

    // Student partner org check (if no high school or zip code provided)
    if (
      register.invalidPartnerOrg(
        highSchoolUpchieveId,
        zipCode,
        studentPartnerOrg
      )
    ) {
      return res.status(422).json({
        err: 'Invalid student partner organization'
      });
    }

    let school;
    if (highSchoolUpchieveId) {
      school = await School.findByUpchieveId(highSchoolUpchieveId);
      if (!school) {
        return res.status(422).json({
          err: 'Invalid UPchieve High School ID'
        });
      }
    }

    const highSchoolApprovalRequired = !studentPartnerOrg && !zipCode;
    if (highSchoolApprovalRequired && school && !school.isApproved)
      return res.status(422).json({
        err: `School ${highSchoolUpchieveId} is not approved`
      });

    const {
      country_code: countryCode,
      org
    } = await IpAddressService.getIpWhoIs(ip);
    let isBanned = false;
    let banReason;

    if (config.bannedServiceProviders.includes(org)) {
      isBanned = true;
      banReason = USER_BAN_REASON.BANNED_SERVICE_PROVIDER;
    } else if (countryCode && countryCode !== 'US') {
      isBanned = true;
      banReason = USER_BAN_REASON.NON_US_SIGNUP;
    }

    const referredBy = await UserCtrl.checkReferral(referredByCode);
    const studentData = {
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      email,
      zipCode,
      studentPartnerOrg,
      partnerUserId,
      approvedHighschool: school,
      isVolunteer: false,
      verified: true, // Students are automatically verified
      referredBy,
      isBanned,
      banReason,
      password,
      ip
    };

    try {
      const student = await UserCtrl.createStudent(studentData);
      await req.login(student);
      return res.json({
        user: student
      });
    } catch (err) {
      Sentry.captureException(err);
      return res.status(422).json({ err: err.message });
    }
  });

  router.post('/register/volunteer', async function(req, res) {
    const { ip } = req;
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
    } = req.body;

    if (!terms) {
      return res.status(422).json({
        err: 'Must accept the user agreement'
      });
    }

    // Verify password, unique email
    const checkResult = await register.newCredentialsInvalid(
      password,
      email,
      res
    );
    if (checkResult) {
      return checkResult;
    }

    // Volunteer partner org check (if no signup code provided)
    if (!code) {
      if (register.invalidVolunteerOrg(volunteerPartnerOrg)) {
        return res.status(422).json({
          err: 'Invalid volunteer partner organization'
        });
      }

      if (register.invalidVolunteerEmailDomain(volunteerPartnerOrg, email)) {
        return res.status(422).json({
          err: 'Invalid email domain for volunteer partner organization'
        });
      }
    }

    const referredBy = await UserCtrl.checkReferral(referredByCode);

    const volunteerData = {
      email,
      isVolunteer: true,
      registrationCode: code,
      volunteerPartnerOrg,
      college,
      phone,
      favoriteAcademicSubject,
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      verified: false,
      referredBy,
      password,
      ip
    };

    try {
      const volunteer = await UserCtrl.createVolunteer(volunteerData);
      await req.login(volunteer);
      return res.json({
        user: volunteer
      });
    } catch (err) {
      Sentry.captureException(err);
      return res.status(422).json({ err: err.message });
    }
  });

  router.get('/partner/volunteer', function(req, res) {
    const volunteerPartnerId = req.query.partnerId;

    if (!volunteerPartnerId) {
      return res.status(422).json({
        err: 'Missing volunteerPartnerId query string'
      });
    }

    const allVolunteerPartnerManifests = config.volunteerPartnerManifests;

    if (!allVolunteerPartnerManifests) {
      return res.status(422).json({
        err: 'Missing volunteerPartnerManifests in config'
      });
    }

    const partnerManifest =
      allVolunteerPartnerManifests[volunteerPartnerId.toString()];

    if (!partnerManifest) {
      return res.status(404).json({
        err: `No manifest found for volunteerPartnerId "${volunteerPartnerId}"`
      });
    }

    return res.json({ volunteerPartner: partnerManifest });
  });

  router.get('/partner/student', function(req, res) {
    const studentPartnerId = req.query.partnerId;

    if (!studentPartnerId) {
      return res.status(422).json({
        err: 'Missing studentPartnerId query string'
      });
    }

    const allStudentPartnerManifests = config.studentPartnerManifests;

    if (!allStudentPartnerManifests) {
      return res.status(422).json({
        err: 'Missing studentPartnerManifests in config'
      });
    }

    const partnerManifest =
      allStudentPartnerManifests[studentPartnerId.toString()];

    if (!partnerManifest) {
      return res.status(404).json({
        err: `No manifest found for studentPartnerId "${studentPartnerId}"`
      });
    }

    return res.json({ studentPartner: partnerManifest });
  });

  router.get('/partner/student/code', function(req, res) {
    const partnerSignupCode = req.query.partnerSignupCode;

    if (!partnerSignupCode) {
      return res.status(422).json({
        err: 'Missing partnerSignupCode query string'
      });
    }

    const allStudentPartnerManifests = config.studentPartnerManifests;

    if (!allStudentPartnerManifests) {
      return res.status(422).json({
        err: 'Missing studentPartnerManifests in config'
      });
    }

    const studentPartnerKey = findKey(allStudentPartnerManifests, {
      signupCode: partnerSignupCode.toString().toUpperCase()
    });

    if (!studentPartnerKey) {
      return res.status(404).json({
        err: `No partner key found for partnerSignupCode "${partnerSignupCode}"`
      });
    }

    return res.json({ studentPartnerKey });
  });

  router.post('/register/check', function(req, res) {
    const code = req.body.code;

    if (!code) {
      res.status(422).json({
        err: 'No registration code given'
      });
      return;
    }

    const isVolunteerCode = Volunteer.checkCode(code);

    res.json({
      isValid: isVolunteerCode
    });
  });

  // List all valid registration codes (admins only)
  router
    .route('/register/volunteercodes')
    .all(authPassport.isAdmin)
    .get(function(req, res) {
      res.json({
        volunteerCodes: config.VOLUNTEER_CODES.split(',')
      });
    });

  router.post('/reset/send', function(req, res) {
    const email = req.body.email;
    if (!email) {
      return res.status(422).json({
        err: 'Must supply an email for password reset'
      });
    }
    ResetPasswordCtrl.initiateReset(
      {
        email: email
      },
      function(err) {
        if (err) {
          next(err);
        } else {
          res.json({
            msg: 'Password reset email sent'
          });
        }
      }
    );
  });

  router.post('/reset/confirm', async function(req, res) {
    const { email, password, newpassword, token } = req.body;

    if (!token) {
      return res.status(422).json({
        err: 'No password reset token given'
      });
    } else if (!email || !password) {
      return res.status(422).json({
        err: 'Must supply an email and password for password reset'
      });
    } else if (!newpassword) {
      return res.status(422).json({
        err: 'Must reenter password for password reset'
      });
    } else if (newpassword !== password) {
      return res.status(422).json({
        err: 'Passwords do not match'
      });
    }

    // Verify password for password reset
    const checkResult = checkPassword(password);
    if (checkResult !== true) {
      return res.status(422).json({
        err: checkResult
      });
    }

    try {
      await ResetPasswordCtrl.finishReset({
        email,
        password,
        token
      });
      return res.sendStatus(200);
    } catch (err) {
      res.status(500).json({
        err: err.message
      });
    }
  });

  router.post('/reset/verify', async (req, res, next) => {
    const { token } = req.body;

    if (!token.match(/^[a-f0-9]{32}$/)) {
      return res.status(422).json({
        err:
          'Please verify that this URL matches the link that was sent to your inbox.'
      });
    }

    try {
      const user = await User.findOne({ passwordResetToken: token });

      if (!user) {
        res.status(404).json({
          err:
            'This URL is no longer valid. Please check your inbox for the most recent password reset request email.'
        });
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      next(err);
    }
  });

  app.use('/auth', router);
};
