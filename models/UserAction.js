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
      USER_ACTION.TYPE.ACCOUNT
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
      USER_ACTION.QUIZ.UNLOCKED_SUBJECT,
      USER_ACTION.SESSION.REPLIED_YES,
      USER_ACTION.SESSION.REQUESTED,
      USER_ACTION.SESSION.JOINED,
      USER_ACTION.SESSION.REJOINED,
      USER_ACTION.SESSION.ENDED,
      USER_ACTION.ACCOUNT.UPDATED_AVAILABILITY,
      USER_ACTION.ACCOUNT.UPDATED_PROFILE,
      USER_ACTION.ACCOUNT.CREATED,
      USER_ACTION.ACCOUNT.APPROVED,
      USER_ACTION.ACCOUNT.ONBOARDED,
      USER_ACTION.ACCOUNT.ADDED_REFERENCE,
      USER_ACTION.ACCOUNT.ADDED_PHOTO_ID,
      USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO,
      USER_ACTION.ACCOUNT.DELETED_REFERENCE,
      USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM,
      USER_ACTION.ACCOUNT.REJECTED_PHOTO_ID,
      USER_ACTION.ACCOUNT.REJECTED_REFERENCE
    ]
  },
  quizCategory: String,
  quizSubcategory: String,
  device: String,
  browser: String,
  browserVersion: String,
  operatingSystem: String,
  operatingSystemVersion: String,
  ipAddress: String,
  referenceEmail: String
})

module.exports = mongoose.model('UserAction', userActionSchema)
