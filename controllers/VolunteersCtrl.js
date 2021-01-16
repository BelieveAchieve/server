const VolunteerModel = require('../models/Volunteer')
const { getAvailabilities } = require('../services/AvailabilityService')

/**
 * Helper function that, given a single users's
 * availability, adds when they are free to the
 * aggAvailabilities object
 * @param {*} availability
 */
function aggregateAvailabilities(availability, aggAvailabilities) {
  Object.keys(availability).map(day => {
    Object.keys(availability[day]).map(time => {
      // create headers based on the user's availability object
      if (!aggAvailabilities.daysOfWeek) {
        aggAvailabilities.daysOfWeek = Object.keys(availability)
      }
      if (!aggAvailabilities.timesOfDay) {
        aggAvailabilities.timesOfDay = Object.keys(availability[day])
      }
      // gets corresponding day and time index inorder to store in aggAvailabilities table
      let dayIndex = aggAvailabilities.daysOfWeek.indexOf(day)
      let timeIndex = aggAvailabilities.timesOfDay.indexOf(time)

      if (availability[day][time]) {
        aggAvailabilities.table[dayIndex][timeIndex]++
      }
    })
  })
  return aggAvailabilities
}

/**
 * Helper function that finds the minimum and maxmimum number of
 * volunteers who signed up that week
 * @param {*} aggAvailabilities
 */
function findMinAndMax(aggAvailabilities) {
  let flatTable = aggAvailabilities.table.flat()
  aggAvailabilities.min = Math.min.apply(Math, flatTable)
  aggAvailabilities.max = Math.max.apply(Math, flatTable)
  return aggAvailabilities
}

module.exports = {
  /**
   * Gets all users who are volunteers, and who are certified in the
   * subject passed in, and aggregates their availability tables into
   * aggAvailabilities.table
   * @param {*} options
   * @param {*} callback
   */
  getVolunteersAvailability: async function(options, callback) {
    const certifiedSubjectQuery = `certifications.${options.certifiedSubject}.passed`

    const volunteerQuery = {
      [certifiedSubjectQuery]: true,
      isFakeUser: false,
      isTestUser: false,
      isFailsafeVolunteer: false,
      isOnboarded: true,
      isDeactivated: false,
      isBanned: false
    }

    try {
      // the projection returns { _id: 1, type: 1}
      const volunteers = await VolunteerModel.find(volunteerQuery)
        .select({ _id: 1 })
        .lean()
        .exec()
      const volunteerIds = volunteers.map(vol => vol._id)
      const availabilityDocs = await getAvailabilities({
        volunteerId: { $in: volunteerIds }
      })

      let aggAvailabilities = {}
      aggAvailabilities.table = Array(7)
        .fill(0)
        .map(() => Array(24).fill(0))
      aggAvailabilities.min = null
      aggAvailabilities.max = 0

      aggAvailabilities = availabilityDocs.reduce((aggAvailabilities, doc) => {
        return aggregateAvailabilities(
          doc.onCallAvailability,
          aggAvailabilities
        )
      }, aggAvailabilities)
      aggAvailabilities = findMinAndMax(aggAvailabilities)
      return callback(aggAvailabilities, null)
    } catch (error) {
      return callback(null, error)
    }
  },

  /**
   * Gets all users who are volunteers
   * @param {*} callback
   */
  getVolunteers: function(callback) {
    VolunteerModel.find({}, function(err, users) {
      if (err) {
        return callback(null, err)
      } else {
        return callback(users, null)
      }
    })
  }
}
