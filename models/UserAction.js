/**
 * Model that keeps track of a user's actions,
 * such as when they start a session, pass a quiz,
 * update their profile, etc.
 */

const mongoose = require('mongoose')
const { USER_ACTION } = require('../constants')

const userActionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  actionType: {
    type: String,
    enum: [
      USER_ACTION.TYPE.QUIZ,
      USER_ACTION.TYPE.SESSION,
      USER_ACTION.TYPE.PROFILE
    ]
  },
  // Specific action
  action: {
    type: String,
    enum: [
      USER_ACTION.QUIZ.STARTED,
      USER_ACTION.QUIZ.PASSED,
      USER_ACTION.QUIZ.FAILED,
      USER_ACTION.QUIZ.VIEWED_MATERIALS,
      USER_ACTION.SESSION.REPLIED_YES,
      USER_ACTION.SESSION.REQUESTED,
      USER_ACTION.SESSION.JOINED,
      USER_ACTION.SESSION.REJOINED,
      USER_ACTION.PROFILE.UPDATED_AVAILABILITY,
      USER_ACTION.PROFILE.UPDATED_PROFILE
    ]
  },
  quizCategory: String,
  quizSubcategory: String,
  device: String,
  browser: String,
  browserVersion: String,
  operatingSystem: String,
  operatingSystemVersion: String
})

module.exports = mongoose.model('UserAction', userActionSchema)
