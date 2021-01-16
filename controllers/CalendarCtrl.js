const _ = require('lodash')
const Volunteer = require('../models/Volunteer')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const {
  updateAvailabilitySnapshot
} = require('../services/AvailabilityService')

module.exports = {
  updateSchedule: async function(options) {
    const user = options.user
    const newAvailability = options.availability
    const newTimezone = options.tz
    const ip = options.ip

    // verify that newAvailability is defined and not null
    if (!newAvailability) {
      // early exit
      throw new Error('No availability object specified')
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
      throw new Error('Availability object missing required keys')
    }

    const currentDate = new Date().toISOString()
    const volunteerUpdates = {
      // @note: keep "availability", "timezone", "availabilityLastModifiedAt" for a volunteer until new availability schema is migrated
      availabilityLastModifiedAt: currentDate,
      availability: newAvailability,
      timezone: newTimezone
    }
    // an onboarded volunteer must have updated their availability, completed required training, and unlocked a subject
    if (!user.isOnboarded && user.subjects.length > 0) {
      volunteerUpdates.isOnboarded = true
      UserActionCtrl.accountOnboarded(user._id, ip)
    }

    const availabilityUpdates = {
      onCallAvailability: newAvailability,
      timezone: newTimezone,
      modifiedAt: currentDate
    }

    await Promise.all([
      updateAvailabilitySnapshot(user._id, availabilityUpdates),
      Volunteer.updateOne({ _id: user._id }, volunteerUpdates)
    ])
  },

  clearSchedule: async function(user, tz) {
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

    await this.updateSchedule({ user, tz, availability: clearedAvailability })
  }
}
