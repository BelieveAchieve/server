const ModerationCtrl = require('../../../controllers/ModerationCtrl')

test('Check incorrect email succeeds', done => {
  const email = { content: 'j.@serve1.proseware.com' }
  ModerationCtrl.moderateMessage(email, function (err, res) {
    expect(res).toBeTruthy()
    done()
  })
})

test('Check incorrect phone number succeeds', done => {
  const phoneNumber = { content: '1ADASDF' }
  ModerationCtrl.moderateMessage(phoneNumber, function (err, res) {
    expect(res).toBeTruthy()
    done()
  })
})

test('Check correct email fails', done => {
  const email = { content: 'student1@upchieve.com' }
  ModerationCtrl.moderateMessage(email, function (err, res) {
    expect(res).toBeFalsy()
    done()
  })
})

test('Check vulgar word fails', done => {
  const word = { content: '5hit' }
  ModerationCtrl.moderateMessage(word, function (err, res) {
    expect(res).toBeFalsy()
    done()
  })
})

test('Check non-vulgar word succeeds', done => {
  const word = { content: 'hello' }
  ModerationCtrl.moderateMessage(word, function (err, res) {
    expect(res).toBeTruthy()
    done()
  })
})

test('Check correct phone number fails', done => {
  const phoneNumber = { content: '(555)555-5555' }
  ModerationCtrl.moderateMessage(phoneNumber, function (err, res) {
    expect(res).toBeFalsy()
    done()
  })
})
