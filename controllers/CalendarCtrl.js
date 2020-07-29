const _ = require('lodash')
const Volunteer = require('../models/Volunteer')
const UserCtrl = require('../controllers/UserCtrl')
const UserActionCtrl = require('../controllers/UserActionCtrl')

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

    const userUpdates = {
      availability: newAvailability,
      timezone: newTimezone
    }

    const currentTime = new Date().toISOString()
    const newElapsedAvailability = UserCtrl.calculateElapsedAvailability(
      user,
      currentTime
    )
    userUpdates.availabilityLastModifiedAt = currentTime
    userUpdates.elapsedAvailability =
      user.elapsedAvailability + newElapsedAvailability

    // an onboarded volunteer must have updated their availability and obtained at least one certification
    if (!user.isOnboarded && UserCtrl.isCertified(user.certifications)) {
      userUpdates.isOnboarded = true
      UserActionCtrl.accountOnboarded(user._id, ip)
    }

    await Volunteer.updateOne({ _id: user._id }, userUpdates)
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
