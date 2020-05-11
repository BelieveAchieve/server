const test = require('ava')
const addLastActivity = require('../../../middleware/add-last-activity')

const USER_ID = '5a39d174a6f3b3973d5633z7'

test('Should execute next() when given no req.user', t => {
  t.plan(1)
  const req = {}
  const next = () => {
    t.pass()
  }
  addLastActivity(req, null, next)
})

test('Should execute next() when user has lastActivityAt value within one day range', t => {
  t.plan(1)
  const req = { user: { _id: USER_ID, lastActivityAt: new Date() } }
  const next = () => {
    t.pass()
  }
  addLastActivity(req, null, next)
})

test.todo('Implement an integration test')
