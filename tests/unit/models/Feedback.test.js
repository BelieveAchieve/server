const test = require('ava')
const Feedback = require('../../../models/Feedback')


test('Check default values on Feedback object', t => {
  const feedback = new Feedback()
  t.is(feedback.studentId, '')
  t.is(feedback.type, '')
  t.is(feedback.subTopic, '')
  t.is(feedback.userType, '')
  t.is(feedback.volunteerId, '')
})
