const test = require('ava')
const ModerationCtrl = require('../../../controllers/ModerationCtrl')

/* 
TODO: Does not fail incorrect email. REGEX problem?   
test.cb('Check incorrect email fails', t => {
  const email = {content:'j.@serve1.proseware.com'}	
  ModerationCtrl.moderateMessage(email, function(err, res) {
  	t.falsy(res)
  	t.end()
  })
})

TODO: Does not fail incorrect phone number. REGEX problem?   
test.cb('Check incorrect phone number fails', t => {
  const phoneNumber = '1ADASDF'
  ModerationCtrl.moderateMessage(phoneNumber, function(err, res) {
  	t.falsy(res)
  	t.end()
  })
})
*/

test.cb('Check correct email passes', t => {
  const email = 'student1@upchieve.com'
  ModerationCtrl.moderateMessage(email, function(err, res) {
  	t.truthy(res)
  	t.end()
  })
})


test.cb('Check vulgar word fails', t => {
  const word = {content:'5hit'}
  ModerationCtrl.moderateMessage(word, function(err, res) {
  	t.falsy(res)
  	t.end()
  })
})


test.cb('Check correct phone number passes', t => {
  const phoneNumber = '(555)555-5555'
  ModerationCtrl.moderateMessage(phoneNumber, function(err, res) {
  	t.truthy(res)
  	t.end()
  })
})





