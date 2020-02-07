const { DAYS } = require('../constants')

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
