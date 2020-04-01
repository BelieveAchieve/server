const moment = require('moment-timezone')
const { DAYS } = require('../constants')

const countOutOfRangeHours = (previousDate, newDate, availability) => {
  const lastModifiedAtDate = moment(previousDate).tz('America/New_York')
  const newModifiedAtDate = moment(newDate).tz('America/New_York')
  const lastModified = {
    day: lastModifiedAtDate.day(),
    hour: lastModifiedAtDate.hour(),
    min: lastModifiedAtDate.minute()
  }
  const newModified = {
    day: newModifiedAtDate.day(),
    hour: newModifiedAtDate.hour(),
    min: newModifiedAtDate.minute()
  }
  const lastModifiedDayOfWeek = DAYS[lastModified.day]
  const newModifiedDayOfWeek = DAYS[newModified.day]
  const lastModifiedDayAvailability = availability[lastModifiedDayOfWeek]
  const newModifiedDayAvailability = availability[newModifiedDayOfWeek]
  let totalHours = 0

  // if lastModifiedMin is 0 that means a full hour of availability was completed,
  // we can ignore the current hour and start deducting from an hour before
  if (lastModified.min === 0 || lastModified.hour === newModified.hour) {
    lastModified.hour -= 1
  }

  // Count hours before the lastModified.hour
  for (let time = lastModified.hour; time >= 0; time--) {
    if (lastModifiedDayAvailability[time]) {
      totalHours++
    }
  }

  // Count hours after the newModified.hour
  for (let time = newModified.hour; time <= 23; time++) {
    if (newModifiedDayAvailability[time]) {
      totalHours++
    }
  }

  return totalHours
}

module.exports = countOutOfRangeHours
