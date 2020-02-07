module.exports = {
  updateSchedule: function(options, callback) {
    const user = options.user
    const availability = options.availability
    const tz = options.tz

    // verify that availability object is defined and not null
    if (!availability) {
      // early exit
      return callback(new Error('No availability object specified'))
    }

    // verify that all of the day-of-week and time-of-day properties are defined on the
    // new availability object
    if (
      Object.keys(user.availability.toObject()).some(key => {
        if (typeof availability[key] === 'undefined') {
          // day-of-week property needs to be defined
          return true
        }

        // time-of-day properties also need to be defined
        return Object.keys(user.availability[key].toObject()).some(
          key2 => typeof availability[key][key2] === 'undefined'
        )
      })
    ) {
      return callback(new Error('Availability object missing required keys'))
    }

    user.availability = availability
    user.availabilityLastModifiedAt = new Date().toISOString()

    // update timezone
    if (tz) {
      user.timezone = tz
    }

    user.save(function(err, user) {
      if (err) {
        callback(err, null)
      } else {
        callback(null, availability)
      }
    })
  }
}
