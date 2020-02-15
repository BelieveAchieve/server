const test = require('ava')
const countOutOfRangeHours = require('../../utils/count-out-of-range-hours')
const {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} = require('../mocks/volunteer-availability')

test('User has no hours out of range selected', async t => {
  // EST Time Zone for dates
  const lastModifiedAt = '2020-02-06T12:52:59.538-05:00' // Thursday
  const newModifiedAt = '2020-04-12T13:40:00.000-05:00' // Sunday
  const expected = 0
  const result = countOutOfRangeHours(
    lastModifiedAt,
    newModifiedAt,
    noHoursSelected
  )
  t.is(expected, result)
})

test('All hours out of range are selected - (Daylight Saving)', async t => {
  // EST Time Zone for dates
  const lastModifiedAt = '2020-02-21T03:52:59.538-05:00' // Friday
  const newModifiedAt = '2020-10-11T17:40:00.000-05:00' // Sunday
  const expected = 10
  const result = countOutOfRangeHours(
    lastModifiedAt,
    newModifiedAt,
    allHoursSelected
  )
  t.is(expected, result)
})

test('Some hours out of range are selected - (Daylight Saving)', async t => {
  // EST Time Zone for dates
  const lastModifiedAt = '2020-02-05T05:39:59.538-05:00' // Wednesday
  const newModifiedAt = '2020-08-25T12:40:00.000-05:00' // Tuesday
  const expected = 3
  const result = countOutOfRangeHours(
    lastModifiedAt,
    newModifiedAt,
    flexibleHoursSelected
  )
  t.is(expected, result)
})
