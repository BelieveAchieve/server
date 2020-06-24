const countAvailabilityHours = require('../../utils/count-availability-hours')
const {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} = require('../mocks/volunteer-availability')

test('Volunteer with flexible hours covering the span of a week', () => {
  const expected = {
    Sunday: 3,
    Monday: 6,
    Tuesday: 6,
    Wednesday: 5,
    Thursday: 3,
    Friday: 6,
    Saturday: 5
  }
  const result = countAvailabilityHours(flexibleHoursSelected)
  expect(expected).toEqual(result)
})

test('Volunteer with 0 hours selected for availability', () => {
  const expected = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0
  }
  const result = countAvailabilityHours(noHoursSelected)
  expect(expected).toEqual(result)
})

test('Volunteer with every hour selected for availability', () => {
  const expected = {
    Sunday: 24,
    Monday: 24,
    Tuesday: 24,
    Wednesday: 24,
    Thursday: 24,
    Friday: 24,
    Saturday: 24
  }
  const result = countAvailabilityHours(allHoursSelected)
  expect(expected).toEqual(result)
})
