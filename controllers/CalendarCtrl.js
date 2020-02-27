module.exports = {
  updateSchedule: function(options, callback) {
    const user = options.user
    const newAvailability = options.availability
    const tz = options.tz

    // verify that newAvailability is defined and not null
    if (!newAvailability) {
      // early exit
      return callback(new Error('No availability object specified'))
    }

    // verify that all of the day-of-week and time-of-day properties are defined on the
    // new availability object
    if (
      Object.keys(user.availability.toObject()).some(key => {
        if (typeof newAvailability[key] === 'undefined') {
          // day-of-week property needs to be defined
          return true
        }

        // time-of-day properties also need to be defined
        return Object.keys(user.availability[key].toObject()).some(
          key2 => typeof newAvailability[key][key2] === 'undefined'
        )
      })
    ) {
      return callback(new Error('Availability object missing required keys'))
    }

    const newModifiedDate = new Date().toISOString()
    user.elapsedAvailability += user.calculateElapsedAvailability(
      newModifiedDate
    )
    user.availabilityLastModifiedAt = newModifiedDate
    user.availability = newAvailability

    // update timezone
    if (tz) {
      user.timezone = tz
    }

    user.save(function(err, user) {
      if (err) {
        callback(err, null)
      } else {
        callback(null, newAvailability)
      }
    })
  }
}
