var User = require('../models/User')

module.exports = {
  updateAvailability: function (options, callback) {
    var userid = options.userid
    var availability = options.availability
    User.findOne({ _id: userid }, function (err, user) {
      if (err) {
        return callback(err)
      }
      if (!user) {
        return callback(new Error('No account with that id found.'))
      }
      user.availability.set(availability)
      user.save(function (err, user) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, availability)
        }
      })
    })
  },

  updateTimezone: function (options, callback) {
    var userid = options.userid
    var tz = options.tz
    User.findOne({ _id: userid }, function (err, user) {
      if (err) {
        return callback(err)
      }
      if (!user) {
        return callback(new Error('No account with that id found.'))
      }
      user.timezone = tz
      user.save(function (err, user) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, tz)
        }
      })
    })
  }
}
