var User = require('../models/User')

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
  var hasUpdate = false

  ;[
    'firstname',
    'lastname',
    'phone',
    'college',
    'favoriteAcademicSubject',
    'referred',
    'heardFrom',
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
  get: function(options, callback) {
    var userId = options.userId
    User.findById(userId, function(err, user) {
      if (err || !user) {
        callback(new Error('Could not get user'))
      } else {
        user.getProfile(callback)
      }
    })
  },

  update: function(options, callback) {
    var userId = options.userId

    var data = options.data || {}

    var update = {}

    // Keys to virtual properties
    var virtualProps = ['phonePretty']

    if (
      virtualProps.some(function(key) {
        return data[key]
      })
    ) {
      // load model object into memory
      User.findById(userId, function(err, user) {
        if (err) {
          callback(err)
        } else {
          if (!user) {
            update = new User()
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
        User.findByIdAndUpdate(
          userId,
          update,
          { new: true, runValidators: true },
          getProfileIfSuccessful(callback)
        )
      })
    }
  }
}
