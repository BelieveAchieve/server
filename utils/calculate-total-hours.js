const { DAYS } = require('../constants')

/**
 *
 * @description Multiples the frequency of the day by the amount of available hours a user has for that given day.
 *
 * @param {Object} availabilityHours - User's availability - Day of the week mapped to the user's available hours for that day
 * @param {Number[]} frequencyOfDaysList - a list with the frequency of days between a date range
 * @returns Number - Total hours
 *
 */
const caculateTotalHours = (availabilityHours, frequencyOfDaysList) => {
  let totalHours = 0
  for (let i = 0; i < frequencyOfDaysList.length; i++) {
    const day = DAYS[i]
    const hours = frequencyOfDaysList[i] * availabilityHours[day]
    totalHours += hours
  }
  return totalHours
}

module.exports = caculateTotalHours
