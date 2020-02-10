const { DAYS } = require('../constants')

/**
 *
 * @param {Object} availability
 * @return an object with the days of the week as properties and the
 * amount of hours in their availability for that day as the value
 *
 * e.g { Sunday: 2, Monday: 10, ..., Saturday: 3 }
 *
 */
const countAvailabilityHours = availability => {
  const availabilityHours = {}
  for (let i = 0; i < DAYS.length; i++) {
    const values = Object.values(availability[DAYS[i]])
    availabilityHours[DAYS[i]] = 0
    for (let j = 0; j < values.length; j++) {
      if (values[j]) {
        availabilityHours[DAYS[i]]++
      }
    }
  }
  return availabilityHours
}

module.exports = countAvailabilityHours
