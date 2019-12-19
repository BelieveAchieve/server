var User = require('../models/User')

module.exports = {
  getAvailability: function (options, callback) {
    var userid = options.userid

    User.findOne({ _id: userid }).exec()
      .then(user => {
        if (!user) {
          throw new Error('No account with that id found.')
        }

        return user.availability
      }).then(availability => {
        callback(null, availability)
      }).catch(err => {
        console.log(err)
        callback(err)
      })
  },

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
  },

  getTimezone: function (options, callback) {
    var userid = options.userid
    User.findOne({ _id: userid }, function (err, user) {
      if (err) {
        return callback(err)
      }
      if (!user) {
        return callback(new Error('No account with that id found.'))
      }
      callback(null, user.timezone)
    })
  }
}
