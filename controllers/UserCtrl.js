const User = require('../models/User')
const Student = require('../models/Student')
const Volunteer = require('../models/Volunteer')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
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
    const { password } = studentData
    const student = new Student(studentData)
    student.referralCode = generateReferralCode(student.id)

    try {
      student.password = await student.hashPassword(password)
      await student.save()
      return student
    } catch (error) {
      throw new Error(error)
    }
  },

  createVolunteer: async function(volunteerData) {
    const { password } = volunteerData
    const volunteer = new Volunteer(volunteerData)
    volunteer.referralCode = generateReferralCode(volunteer.id)

    try {
      volunteer.password = await volunteer.hashPassword(password)
      await Promise.all([
        volunteer.save(),
        createAvailabilitySnapshot(volunteer._id)
      ])
      return volunteer
    } catch (error) {
      throw new Error(error)
    }
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
