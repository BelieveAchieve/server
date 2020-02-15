const moment = require('moment-timezone')
/**
 *
 * @param {(Date | String)} start
 * @param {(Date | String)} end
 *
 * @returns an array with the frequency of days occuring between {start} and {end} (inclusive). Indexed from Sunday to Saturday.
 *
 * Example:
 * [0,0,0,1,1,1,0]
 * would signify a range of 3 from Wednesday to Friday.
 *
 */
const getFrequencyOfDays = (start, end) => {
  const startDate = moment(start)
  const endDate = moment(end)
  const amountOfWeeks = Math.floor(
    Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) / 7
  )
  const dayFrequencyList = Array(7).fill(amountOfWeeks)
  const startDayOfWeek = startDate.day()
  const endDayOfWeek = endDate.day()

  if (startDayOfWeek <= endDayOfWeek) {
    // leftover days are to the right of the startDayOfWeek
    dayFrequencyList.fill(amountOfWeeks + 1, startDayOfWeek, endDayOfWeek + 1)
  } else {
    // leftover days are to the left of endDayOfWeek and
    // leftover days are to the right of startDayOfWeek
    dayFrequencyList.fill(amountOfWeeks + 1, startDayOfWeek, 7)
    dayFrequencyList.fill(amountOfWeeks + 1, 0, endDayOfWeek + 1)
  }
  return dayFrequencyList
}

module.exports = getFrequencyOfDays
