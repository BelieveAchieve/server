const calculateTotalHours = require('../../utils/calculate-total-hours')

test('Sum product of same day', () => {
  const availabilityHours = {
    Sunday: 5,
    Monday: 3,
    Tuesday: 4,
    Wednesday: 5,
    Thursday: 2,
    Friday: 3,
    Saturday: 7
  }
  const frequencyOfDaysList = [0, 0, 0, 1, 0, 0, 0]
  const expected = 5
  const result = calculateTotalHours(availabilityHours, frequencyOfDaysList)
  expect(expected).toEqual(result)
})

test('Sum product of a week', () => {
  const availabilityHours = {
    Sunday: 5,
    Monday: 3,
    Tuesday: 4,
    Wednesday: 5,
    Thursday: 2,
    Friday: 3,
    Saturday: 7
  }
  const frequencyOfDaysList = [1, 1, 1, 1, 1, 1, 1]
  const expected = 29
  const result = calculateTotalHours(availabilityHours, frequencyOfDaysList)
  expect(expected).toEqual(result)
})

test('Sum product after 3 days', () => {
  const availabilityHours = {
    Sunday: 5,
    Monday: 3,
    Tuesday: 4,
    Wednesday: 5,
    Thursday: 2,
    Friday: 3,
    Saturday: 7
  }
  const frequencyOfDaysList = [0, 1, 1, 1, 0, 0, 0]
  const expected = 12
  const result = calculateTotalHours(availabilityHours, frequencyOfDaysList)
  expect(expected).toEqual(result)
})

test('Sum product after 2 years and 13 days', () => {
  const availabilityHours = {
    Sunday: 5,
    Monday: 3,
    Tuesday: 4,
    Wednesday: 5,
    Thursday: 2,
    Friday: 3,
    Saturday: 7
  }

  const frequencyOfDaysList = [107, 107, 106, 106, 106, 106, 106]
  const expected = 3082
  const result = calculateTotalHours(availabilityHours, frequencyOfDaysList)
  expect(expected).toEqual(result)
})
