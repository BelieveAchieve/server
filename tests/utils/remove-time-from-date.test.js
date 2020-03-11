const test = require('ava')
const removeTimeFromDate = require('../../utils/remove-time-from-date')

test('Given ISO String should remove time from date', t => {
  const date = '2020-02-06T12:52:59.538+00:00'
  const expected = '2020-02-06'
  const result = removeTimeFromDate(date)
  t.is(expected, result)
})
