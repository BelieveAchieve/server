const removeTimeFromDate = date => {
  const newDate = new Date(date)
  const year = newDate.getFullYear()
  let month = newDate.getMonth() + 1
  let day = newDate.getUTCDate()

  if (month < 10) month = `0${month}`
  if (day < 10) day = `0${day}`

  return `${year}-${month}-${day}`
}

module.exports = removeTimeFromDate
