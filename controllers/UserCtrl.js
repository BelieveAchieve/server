const User = require('../models/User')
const Student = require('../models/Student')
const Volunteer = require('../models/Volunteer')
const Session = require('../models/Session')
const moment = require('moment-timezone')
const Sentry = require('@sentry/node')
const base64url = require('base64url')
const MailService = require('../services/MailService')
const VerificationCtrl = require('../controllers/VerificationCtrl')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const countAvailabilityHours = require('../utils/count-availability-hours')
const removeTimeFromDate = require('../utils/remove-time-from-date')
const getFrequencyOfDays = require('../utils/get-frequency-of-days')
const calculateTotalHours = require('../utils/calculate-total-hours')
const countOutOfRangeHours = require('../utils/count-out-of-range-hours')

const generateReferralCode = userId => base64url(Buffer.from(userId, 'hex'))

function isCertified(certifications) {
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

function isOnboarded(volunteer) {
  const { availabilityLastModifiedAt, certifications } = volunteer
  return !!availabilityLastModifiedAt && isCertified(certifications)
}

module.exports = {
  getVolunteerStats: async user => {
    const pastSessions = await Session.find({ volunteer: user._id })
      .select('volunteerJoinedAt endedAt messages')
      .lean()
      .exec()
    const threeHoursMs = 1000 * 60 * 60 * 3
    const fifteenMinsMs = 1000 * 60 * 15

    const millisecondsTutored = pastSessions.reduce((totalMs, session) => {
      const { volunteerJoinedAt, endedAt, messages } = session

      if (!(volunteerJoinedAt && endedAt)) return totalMs

      const volunteerJoinDate = new Date(volunteerJoinedAt)
      const sessionEndDate = new Date(endedAt)
      let sessionLengthMs = sessionEndDate - volunteerJoinDate

      // skip if volunteer joined after the session ended
      if (sessionLengthMs < 0) return totalMs

      if (messages.length === 0) return sessionLengthMs + totalMs

      let latestMessageIndex = messages.length - 1

      // get the latest message that was sent within a 15 minute window of the message prior.
      // Sometimes sessions are not ended by either participant and one of the participants may send
      // a message to see if the other participant is still active before ending the session.
      // Exclude these messages when getting the total session end time
      if (sessionLengthMs > threeHoursMs) {
        while (
          latestMessageIndex > 0 &&
          messages[latestMessageIndex].createdAt -
            messages[latestMessageIndex - 1].createdAt >
            fifteenMinsMs
        ) {
          latestMessageIndex--
        }
      }

      const latestMessageDate = new Date(messages[latestMessageIndex].createdAt)
      sessionLengthMs = latestMessageDate - volunteerJoinDate

      return sessionLengthMs + totalMs
    }, 0)

    // milliseconds in an hour = (60,000 * 60) = 3,600,000
    const hoursTutored = (millisecondsTutored / 3600000).toFixed(2)

    const stats = {
      hoursTutored: hoursTutored
    }

    return stats
  },

  deleteUserByEmail: function(userEmail) {
    return User.deleteOne({ email: userEmail }).exec()
  },

  // Calculates the amount of hours between a volunteer's availabilityLastModifiedAt
  // and the current time that a user updates to a new availability.
  // Expects a "lean" (non-Mongoose doc) volunteer to be passed in,
  // otherwise the volunteer needs to be coerced using the mongoose method "toObject()"
  calculateElapsedAvailability: function(volunteer, newModifiedDate) {
    // A volunteer must be onboarded before calculating their elapsed availability
    if (!isOnboarded(volunteer)) return 0

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

    // Send internal email alert if new volunteer is from a partner org
    if (volunteer.volunteerPartnerOrg) {
      MailService.sendPartnerOrgSignupAlert({
        name: `${volunteer.firstname} ${volunteer.lastname}`,
        email: volunteer.email,
        company: volunteer.volunteerPartnerOrg,
        upchieveId: volunteer._id
      })
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

    return volunteer
  }
}
