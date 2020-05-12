const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const Session = require('../models/Session')

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
  let hasUpdate = false

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

module.exports = {
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
    const userId = options.userId
    const data = options.data || {}
    let update = {}
    // Keys to virtual properties
    const virtualProps = ['phonePretty']

    if (
      virtualProps.some(function(key) {
        return data[key]
      })
    ) {
      // load model object into memory
      // @note: Currently only a volunteer is able to update their profile
      Volunteer.findById(userId, function(err, user) {
        if (err) {
          callback(err)
        } else {
          if (!user) {
            update = new Volunteer()
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
        Volunteer.findByIdAndUpdate(
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
  }
}
