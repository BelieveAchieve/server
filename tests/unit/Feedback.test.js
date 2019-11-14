const test = require('ava')
const Feedback = require('../../models/Feedback')

test('hello world', t => {
  const feedback = new Feedback({ studentId: 'student1' })
  t.is(feedback.studentId, 'student1')
})
