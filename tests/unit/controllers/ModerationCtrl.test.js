const test = require('ava')
const ModerationCtrl = require('../../../controllers/ModerationCtrl')

test.cb('Check incorrect email succeeds', t => {
  const email = { content: 'j.@serve1.proseware.com' }
  ModerationCtrl.moderateMessage(email, function (err, res) {
    t.truthy(res)
    t.end()
  })
})

test.cb('Check incorrect phone number succeeds', t => {
  const phoneNumber = { content: '1ADASDF' }
  ModerationCtrl.moderateMessage(phoneNumber, function (err, res) {
    t.truthy(res)
    t.end()
  })
})

test.cb('Check correct email fails', t => {
  const email = { content: 'student1@upchieve.com' }
  ModerationCtrl.moderateMessage(email, function (err, res) {
    t.falsy(res)
    t.end()
  })
})

test.cb('Check vulgar word fails', t => {
  const word = { content: '5hit' }
  ModerationCtrl.moderateMessage(word, function (err, res) {
    t.falsy(res)
    t.end()
  })
})

test.cb('Check non-vulgar word succeeds', t => {
  const word = { content: 'hello' }
  ModerationCtrl.moderateMessage(word, function (err, res) {
    t.truthy(res)
    t.end()
  })
})

test.cb('Check correct phone number fails', t => {
  const phoneNumber = { content: '(555)555-5555' }
  ModerationCtrl.moderateMessage(phoneNumber, function (err, res) {
    t.falsy(res)
    t.end()
  })
})
