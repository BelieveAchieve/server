const { DAYS } = require('../constants')

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
