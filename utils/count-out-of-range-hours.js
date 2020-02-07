const { DAYS, UTC_TO_HOUR_MAPPING } = require('../constants')

const countOutOfRangeHours = (previousDate, newDate, availability) => {
  const lastModifiedAtDate = new Date(previousDate)
  const newModifiedAtDate = new Date(newDate)
  const lastModified = {
    day: lastModifiedAtDate.getDay(),
    hour: lastModifiedAtDate.getUTCHours(),
    min: lastModifiedAtDate.getUTCMinutes()
  }
  const newModified = {
    day: newModifiedAtDate.getDay(),
    hour: newModifiedAtDate.getUTCHours(),
    min: newModifiedAtDate.getUTCMinutes()
  }
  const lastModifiedDayOfWeek = DAYS[lastModified.day]
  const newModifiedDayOfWeek = DAYS[newModified.day]
  const lastModifiedDayAvailability = availability[lastModifiedDayOfWeek]
  const newModifiedDayAvailability = availability[newModifiedDayOfWeek]
  let totalHours = 0

  if (lastModified.min === 0 || lastModified.hour === newModified.hour) {
    lastModified.hour -= 1
  }

  for (let i = lastModified.hour; i >= 0; i--) {
    const time = UTC_TO_HOUR_MAPPING[i]
    if (lastModifiedDayAvailability[time]) {
      totalHours++
    }
  }

  for (let i = newModified.hour; i <= 23; i++) {
    const time = UTC_TO_HOUR_MAPPING[i]
    if (newModifiedDayAvailability[time]) {
      totalHours++
    }
  }

  return totalHours
}

module.exports = countOutOfRangeHours
