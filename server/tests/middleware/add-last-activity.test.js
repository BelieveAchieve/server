const addLastActivity = require('../../middleware/add-last-activity')

const USER_ID = '5a39d174a6f3b3973d5633z7'

test('Should execute next() when given no req.user', () => {
  const req = {}
  const mockNextCallback = jest.fn(() => {})
  addLastActivity(req, null, mockNextCallback)
  expect(mockNextCallback.mock.calls.length).toBe(1)
})

test('Should execute next() when user has lastActivityAt value within one day range', () => {
  const req = { user: { _id: USER_ID, lastActivityAt: new Date() } }
  const mockNextCallback = jest.fn(() => {})
  addLastActivity(req, null, mockNextCallback)
  expect(mockNextCallback.mock.calls.length).toBe(1)
})

test.todo('TODO: Implement an integration test')
