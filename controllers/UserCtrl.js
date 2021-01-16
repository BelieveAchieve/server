const User = require('../models/User')
const Student = require('../models/Student')
const Volunteer = require('../models/Volunteer')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
const MailService = require('../services/MailService')
const VerificationCtrl = require('../controllers/VerificationCtrl')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const {
  createAvailabilitySnapshot
} = require('../services/AvailabilityService')

const generateReferralCode = userId => base64url(Buffer.from(userId, 'hex'))

module.exports = {
  deleteUserByEmail: function(userEmail) {
    return User.deleteOne({ email: userEmail }).exec()
  },

  checkReferral: async function(referredByCode) {
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

    return referredById
  },

  createStudent: async function(studentData) {
    const { password, ip } = studentData
    const student = new Student(studentData)
    student.referralCode = generateReferralCode(student.id)

    try {
      student.password = await student.hashPassword(password)
      await student.save()
    } catch (error) {
      throw new Error(error)
    }

    try {
      MailService.sendStudentWelcomeEmail({
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

    try {
      await MailService.createContact(student)
    } catch (err) {
      Sentry.captureException(err)
    }

    return student
  },

  createVolunteer: async function(volunteerData) {
    const { password, ip } = volunteerData
    const volunteer = new Volunteer(volunteerData)
    volunteer.referralCode = generateReferralCode(volunteer.id)

    try {
      volunteer.password = await volunteer.hashPassword(password)
      await Promise.all([
        volunteer.save(),
        createAvailabilitySnapshot(volunteer._id)
      ])
    } catch (error) {
      throw new Error(error)
    }

    try {
      await VerificationCtrl.initiateVerification({ user: volunteer })
    } catch (err) {
      Sentry.captureException(err)
    }

    try {
      await UserActionCtrl.createdAccount(volunteer._id, ip)
    } catch (err) {
      Sentry.captureException(err)
    }

    try {
      await MailService.createContact(volunteer)
    } catch (err) {
      Sentry.captureException(err)
    }

    return volunteer
  },

  isCertified: function(certifications) {
    let isCertified = false

    for (const subject in certifications) {
      if (
        certifications.hasOwnProperty(subject) &&
        certifications[subject].passed
      ) {
        isCertified = true
        break
      }
    }

    return isCertified
  }
}
