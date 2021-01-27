/* eslint-disable handle-callback-err */
const ModerationCtrl = require('../../controllers/ModerationCtrl')

test('Check incorrect email succeeds', done => {
  const email = { content: 'j.@serve1.proseware.com' }
  expect(ModerationCtrl.moderateMessage(email)).toBeTruthy()
  done()
})

test('Check incorrect phone number succeeds', done => {
  const phoneNumber = {
    content: 'a message including 0.001193067% which is not a phone number'
  }
  expect(ModerationCtrl.moderateMessage(phoneNumber)).toBeTruthy()
  done()
})

test('Check correct email fails', done => {
  const email = { content: 'student1@upchieve.com' }
  expect(ModerationCtrl.moderateMessage(email)).toBeFalsy()
  done()
})

test('Check vulgar word fails', done => {
  const word = { content: '5hit' }
  expect(ModerationCtrl.moderateMessage(word)).toBeFalsy()
  done()
})

test('Check non-vulgar word succeeds', done => {
  const word = { content: 'hello' }
  expect(ModerationCtrl.moderateMessage(word)).toBeTruthy()
  done()
})

test('Check correct phone number fails', done => {
  const phoneNumber = {
    content: 'a message including (555)555-5555 which is a phone number'
  }
  expect(ModerationCtrl.moderateMessage(phoneNumber)).toBeFalsy()
  done()
})
