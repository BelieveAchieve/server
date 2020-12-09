const User = require('../models/User')
const Student = require('../models/Student')
const Volunteer = require('../models/Volunteer')
const moment = require('moment-timezone')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
const MailService = require('../services/MailService')
const StatsService = require('../services/StatsService')
const VerificationCtrl = require('../controllers/VerificationCtrl')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const countAvailabilityHours = require('../utils/count-availability-hours')
const removeTimeFromDate = require('../utils/remove-time-from-date')
const getFrequencyOfDays = require('../utils/get-frequency-of-days')
const calculateTotalHours = require('../utils/calculate-total-hours')
const countOutOfRangeHours = require('../utils/count-out-of-range-hours')

const generateReferralCode = userId => base64url(Buffer.from(userId, 'hex'))

module.exports = {
  deleteUserByEmail: function(userEmail) {
    return User.deleteOne({ email: userEmail }).exec()
  },

  // Calculates the amount of hours between a volunteer's availabilityLastModifiedAt
  // and the current time that a user updates to a new availability.
  // Expects a "lean" (non-Mongoose doc) volunteer to be passed in,
  // otherwise the volunteer needs to be coerced using the mongoose method "toObject()"
  calculateElapsedAvailability: function(volunteer, newModifiedDate) {
    // A volunteer must be onboarded before calculating their elapsed availability
    if (!volunteer.isOnboarded) return 0

    const { availability, availabilityLastModifiedAt } = volunteer

    const availabilityLastModifiedAtFormatted = moment(
      availabilityLastModifiedAt
    )
      .tz('America/New_York')
      .format()
    const estTimeNewModifiedDate = moment(newModifiedDate)
      .tz('America/New_York')
      .format()

    // Convert availability to an object formatted with the day of the week
    // as the property and the amount of hours they have available for that day as the value
    // e.g { Monday: 10, Tuesday: 3 }
    const totalAvailabilityHoursMapped = countAvailabilityHours(availability)

    // Count the occurrence of days of the week between a start and end date
    const frequencyOfDaysList = getFrequencyOfDays(
      removeTimeFromDate(availabilityLastModifiedAtFormatted),
      removeTimeFromDate(estTimeNewModifiedDate)
    )

    let totalHours = calculateTotalHours(
      totalAvailabilityHoursMapped,
      frequencyOfDaysList
    )

    // Deduct the amount hours that fall outside of the start and end date time
    const outOfRangeHours = countOutOfRangeHours(
      availabilityLastModifiedAtFormatted,
      estTimeNewModifiedDate,
      availability
    )
    totalHours -= outOfRangeHours

    return totalHours
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

    const segmentSlugs = [`student-${student.studentPartnerOrg}`]
    StatsService.increment(
      'students',
      {
        // state is a 'derived' dimension
        // calc on impact-api end that gets state from zipCode
        state: student.zipCode
      },
      { segmentSlugs }
    )
    StatsService.updateActiveStudents(student.id)

    return student
  },

  createVolunteer: async function(volunteerData) {
    const { password, ip } = volunteerData
    const volunteer = new Volunteer(volunteerData)
    volunteer.referralCode = generateReferralCode(volunteer.id)

    try {
      volunteer.password = await volunteer.hashPassword(password)
      await volunteer.save()
    } catch (error) {
      throw new Error(error)
    }

    const segmentSlugs = [
      `volunteer-${volunteer.volunteerPartnerOrg || 'none'}`
    ]
    StatsService.increment(
      'volunteers',
      { partnerOrg: volunteer.volunteerPartnerOrg },
      { segmentSlugs }
    )
    StatsService.updateActiveVolunteers(volunteer.id)

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
