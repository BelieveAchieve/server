const test = require('ava')
const getFrequencyOfDays = require('../../utils/get-frequency-of-days')

test('Start date and end date are the same day', t => {
  const startDate = '2020-02-06'
  const endDate = '2020-02-06'
  const expected = [0, 0, 0, 0, 1, 0, 0]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})

test('Start Date: first of leap year - End Date: first of next year', t => {
  const startDate = '2020-01-01'
  const endDate = '2021-01-01'
  const expected = [52, 52, 52, 53, 53, 53, 52]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})

test('Start Date: first of year - End Date: first of next year', t => {
  const startDate = '2021-01-01'
  const endDate = '2022-01-01'
  const expected = [52, 52, 52, 52, 52, 53, 53]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})

test('February day of week frequency should have one extra day on leap year', t => {
  const startDate = '2020-02-01'
  const endDate = '2020-02-29'
  const expected = [4, 4, 4, 4, 4, 4, 5]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})

test('February day of week frequency should all be 4', t => {
  const startDate = '2021-02-01'
  const endDate = '2021-02-28'
  const expected = [4, 4, 4, 4, 4, 4, 4]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})

test('String dates to fn should return correct output', t => {
  const startDate = '2020-02-05'
  const endDate = '2020-02-06'
  const expected = [0, 0, 0, 1, 1, 0, 0]
  const result = getFrequencyOfDays(startDate, endDate)
  t.deepEqual(expected, result)
})
