module.exports = {
  updateAvailability: function(options, callback) {
    const user = options.user
    const availability = options.availability

    user.availability.set(availability)
    user.availabilityLastModifiedAt = new Date().toISOString()
    user.save(function(err, user) {
      if (err) {
        callback(err, null)
      } else {
        callback(null, availability)
      }
    })
  },

  updateTimezone: function(options, callback) {
    const user = options.user
    const tz = options.tz

    user.timezone = tz
    user.save(function(err, user) {
      if (err) {
        callback(err, null)
      } else {
        callback(null, tz)
      }
    })
  }
}
