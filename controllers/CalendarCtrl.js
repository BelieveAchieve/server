var User = require('../models/User')

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const hours = [
  '12a',
  '1a',
  '2a',
  '3a',
  '4a',
  '5a',
  '6a',
  '7a',
  '8a',
  '9a',
  '10a',
  '11a',
  '12p',
  '1p',
  '2p',
  '3p',
  '4p',
  '5p',
  '6p',
  '7p',
  '8p',
  '9p',
  '10p',
  '11p'
]

function initAvailability (user, callback) {
  /*
   * Create an availability object like:
   * {
   *   Sunday: {
   *     '12a': false,
   *     '1a': false,
   *     ...
   *   },
   *   Monday, {
   *     ...
   *   },
   *   ...
   * }
   */
  const availability = days.map(day => [
    day,
    hours.reduce((obj, hour) => {
      obj[hour] = false
      return obj
    }, {})
  ])
    .reduce((obj, [day, hoursObj]) => {
      obj[day] = hoursObj
      return obj
    }, {})

  user.availability = availability
  user.hasSchedule = true
  user.timezone = ''

  const promise = user.save()
    .then(user => {
      return availability
    })

  if (!callback) {
    return promise
  } else {
    promise
      .then(availability => callback(null, availability))
      .catch(err => callback(err))
  }
}

module.exports = {
  getAvailability: function (options, callback) {
    var userid = options.userid

    User.findOne({ _id: userid }).exec()
      .then(user => {
        if (!user) {
          throw new Error('No account with that id found.')
        }

        if (user.hasSchedule) {
          return user.availability
        } else {
          return initAvailability(user)
        }
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
      
      // validate the object received from the client and create the new
      // availability object to be saved
      const newAvailability = days.map(day => [
        day,
        hours.reduce((obj, hour) => {
          obj[hour] = (
              typeof(availability[day]) === "undefined" ||
              typeof(availability[day][hour]) === "undefined"
            ) ?
              user.availability[day][hour] :
              availability[day][hour]
          return obj
        }, {})
      ])
        .reduce((obj, [day, hoursObj]) => {
          obj[day] = hoursObj
          return obj
        }, {})
      
      user.availability = newAvailability
      user.hasSchedule = true
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
