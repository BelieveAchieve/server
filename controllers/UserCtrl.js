const User = require('../models/User')
const Session = require('../models/Session')
const moment = require('moment-timezone')
const countAvailabilityHours = require('../utils/count-availability-hours')
const removeTimeFromDate = require('../utils/remove-time-from-date')
const getFrequencyOfDays = require('../utils/get-frequency-of-days')
const calculateTotalHours = require('../utils/calculate-total-hours')
const countOutOfRangeHours = require('../utils/count-out-of-range-hours')

// helper to check for errors before getting user profile
function getProfileIfSuccessful(callback) {
  return function(err, user) {
    if (err) {
      return callback(err)
    } else {
      user.getProfile(callback)
    }
  }
}

// helper to iterate through keys to be added to an update object
function iterateKeys(update, data, callback) {
  var hasUpdate = false

  ;[
    'firstname',
    'lastname',
    'phone',
    'college',
    'favoriteAcademicSubject',
    'phonePretty'
  ].forEach(function(key) {
    if (data[key]) {
      update[key] = data[key]
      hasUpdate = true
    }
  })

  if (!hasUpdate) {
    callback(new Error('No fields defined to update'))
  } else {
    callback(null, update)
  }
}

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
  get: function(options, callback) {
    var userId = options.userId
    User.findById(userId, function(err, user) {
      if (err || !user) {
        callback(new Error('Could not get user'))
      } else {
        user.getProfile(callback)
      }
    })
  },

  getVolunteerStats: async user => {
    const pastSessions = await Session.find({ volunteer: user._id })
      .select('volunteerJoinedAt endedAt')
      .lean()
      .exec()

    const millisecondsTutored = pastSessions.reduce((totalMs, session) => {
      if (!(session.volunteerJoinedAt && session.endedAt)) {
        return totalMs
      }

      const volunteerJoinDate = new Date(session.volunteerJoinedAt)
      const sessionEndDate = new Date(session.endedAt)
      const sessionLengthMs = sessionEndDate - volunteerJoinDate

      // skip if session was longer than 5 hours
      if (sessionLengthMs > 18000000) {
        return totalMs
      }

      // skip if volunteer joined after the session ended
      if (sessionLengthMs < 0) {
        return totalMs
      }

      return sessionLengthMs + totalMs
    }, 0)

    // milliseconds in an hour = (60,000 * 60) = 3,600,000
    const hoursTutored = (millisecondsTutored / 3600000).toFixed(2)

    const stats = {
      hoursTutored: hoursTutored
    }

    return stats
  },

  update: function(options, callback) {
    var userId = options.userId

    var data = options.data || {}

    var update = {}

    // Keys to virtual properties
    var virtualProps = ['phonePretty']

    if (
      virtualProps.some(function(key) {
        return data[key]
      })
    ) {
      // load model object into memory
      User.findById(userId, function(err, user) {
        if (err) {
          callback(err)
        } else {
          if (!user) {
            update = new User()
          } else {
            update = user
          }
          iterateKeys(update, data, function(err, update) {
            if (err) {
              return callback(err)
            }
            // save the model that was loaded into memory, processing the virtuals
            update.save(getProfileIfSuccessful(callback))
          })
        }
      })
    } else {
      iterateKeys(update, data, function(err, update) {
        if (err) {
          return callback(new Error('No fields defined to update'))
        }
        // update the document directly (more efficient, but ignores virtual props)
        User.findByIdAndUpdate(
          userId,
          update,
          { new: true, runValidators: true },
          getProfileIfSuccessful(callback)
        )
      })
    }
  },

  deleteUserByEmail: function(userEmail) {
    return User.deleteOne({ email: userEmail }).exec()
  },

  // Calculates the amount of hours between a volunteer's availabilityLastModifiedAt
  // and the current time that a user updates to a new availability.
  // Expects a "lean" (non-Mongoose doc) volunteer to be passed,
  // otherwise availability needs coerced using toObject()
  calculateElapsedAvailability: function(volunteer, newModifiedDate) {
    // A volunteer must be onboarded before calculating their elapsed availability
    if (!isOnboarded(volunteer)) return 0

    const { availability, availabilityLastModifiedAt } = volunteer

    // console.log('the avail', availability)

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

    console.log('runnning')

    return totalHours
  }
}
