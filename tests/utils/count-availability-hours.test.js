const test = require('ava')
const countAvailabilityHours = require('../../utils/count-availability-hours')
const {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} = require('../mocks/volunteer-availability')

test('Volunteer with flexible hours covering the span of a week', t => {
  const expected = {
    sunday: 3,
    monday: 6,
    tuesday: 6,
    wednesday: 5,
    thursday: 3,
    friday: 6,
    saturday: 5
  }
  const result = countAvailabilityHours(flexibleHoursSelected)
  t.deepEqual(expected, result)
})

test('Volunteer with 0 hours selected for availability', t => {
  const expected = {
    sunday: 0,
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0
  }
  const result = countAvailabilityHours(noHoursSelected)
  t.deepEqual(expected, result)
})

test('Volunteer with every hour selected for availability', t => {
  const expected = {
    sunday: 24,
    monday: 24,
    tuesday: 24,
    wednesday: 24,
    thursday: 24,
    friday: 24,
    saturday: 24
  }
  const result = countAvailabilityHours(allHoursSelected)
  t.deepEqual(expected, result)
})
