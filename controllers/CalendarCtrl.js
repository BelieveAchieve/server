const _ = require('lodash')
const User = require('../models/User')

module.exports = {
  updateSchedule: function(options, callback) {
    const user = options.user
    const newAvailability = options.availability
    const newTimezone = options.tz

    // verify that newAvailability is defined and not null
    if (!newAvailability) {
      // early exit
      return callback(new Error('No availability object specified'))
    }

    // verify that all of the day-of-week and time-of-day properties are defined on the
    // new availability object
    if (
      Object.keys(user.availability).some(key => {
        if (typeof newAvailability[key] === 'undefined') {
          // day-of-week property needs to be defined
          return true
        }

        // time-of-day properties also need to be defined
        return Object.keys(user.availability[key]).some(
          key2 => typeof newAvailability[key][key2] === 'undefined'
        )
      })
    ) {
      return callback(new Error('Availability object missing required keys'))
    }

    const userUpdates = {
      availability: newAvailability,
      timezone: newTimezone
    }

    /**
     * Set availabilityLastModifiedAt if this is the user's first time modifying their availability
     * Otherwise, leave it to the nightly cron job
     */
    if (!user.availabilityLastModifiedAt) {
      userUpdates.availabilityLastModifiedAt = new Date().toISOString()
    }

    User.updateOne({ _id: user._id }, userUpdates, function(err) {
      if (err) {
        callback(err, null)
      } else {
        callback(null, newAvailability)
      }
    })
  },

  clearSchedule: function(user, tz, callback) {
    const clearedAvailability = _.reduce(
      user.availability,
      (clearedWeek, dayVal, dayKey) => {
        clearedWeek[dayKey] = _.reduce(
          dayVal,
          (clearedDay, hourVal, hourKey) => {
            clearedDay[hourKey] = false
            return clearedDay
          },
          {}
        )
        return clearedWeek
      },
      {}
    )

    this.updateSchedule(
      { user, tz, availability: clearedAvailability },
      callback
    )
  }
}
