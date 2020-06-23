const removeTimeFromDate = require('../../utils/remove-time-from-date')

test('Given ISO String should remove time from date', () => {
  const date = '2020-02-06T12:52:59.538+00:00'
  const expected = '2020-02-06'
  const result = removeTimeFromDate(date)
  expect(expected).toBe(result)
})
