var User = require('../models/User')

// helper to respond to errors

function getProfileIfSuccessful(callback) {
  return function (err, user) {
    if (err) {
      return callback(err)
    } else {
      user.getProfile(callback)
    }
  }
}

module.exports = {
  get: function (options, callback) {
    var userId = options.userId
    User.findById(userId, function (err, user) {
      if (err || !user) {
        callback('Could not get user')
      } else {
        user.getProfile(callback)
      }
    })
  },
  update: function (options, callback) {
    var userId = options.userId

    var data = options.data || {}

    var update = {}

    var hasUpdate = false

    // Keys to virtual properties
    var virtualProps = ['phonePretty']
    if (virtualProps.some(function (key) { return data[key] })) {
      // load model object into memory
      User.findById(userId, function (err, user) {
        if (err) {
          callback(err)
        }
        else {
          if (!user) {
            update = new User()
          }
          else {
            update = user
          }
          iterateKeysAndUpdate()
        }
      })
    }
    else {
      iterateKeysAndUpdate()
    }

    // Define and iterate through keys to add to update object
    var iterateKeysAndUpdate = function () {
      ;[
        'firstname',
        'lastname',
        'nickname',
        'picture',
        'birthdate',
        'serviceInterests',
        'gender',
        'race',
        'groupIdentification',
        'computerAccess',
        'preferredTimes',
        'phone',
        'highschool',
        'currentGrade',
        'expectedGraduation',
        'difficultAcademicSubject',
        'difficultCollegeProcess',
        'highestLevelEducation',
        'hasGuidanceCounselor',
        'gpa',
        'college',
        'collegeApplicationsText',
        'commonCollegeDocs',
        'academicInterestsText',
        'testScoresText',
        'advancedCoursesText',
        'favoriteAcademicSubject',
        'extracurricularActivitesText',
        'referred',
        'heardFrom',
        'phonePretty'
      ].forEach(function (key) {
        if (data[key]) {
          update[key] = data[key]
          hasUpdate = true
        }
      })

      if (!hasUpdate) {
        return callback('No fields defined to update')
      }

      if (virtualProps.some(function (key) { return data[key] })) {
        // save the model that was loaded into memory
        update.save(getProfileIfSuccessful(callback))
      }
      else {
        // update the model (more efficient, but ignores virtual props)
        User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }, getProfileIfSuccessful(callback))
      }
    }
  }
}
