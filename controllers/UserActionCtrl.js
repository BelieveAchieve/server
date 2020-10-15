const UserAction = require('../models/UserAction')
const { USER_ACTION, USER_ACTION_TYPE } = require('../constants')
const getSubjectType = require('../utils/getSubjectType')
const getDeviceFromUserAgent = require('../utils/getDeviceFromUserAgent')
const userAgentParser = require('ua-parser-js')

// @todo: refactor using TypeScript

const getUserAgentInfo = userAgent => {
  const userAgentParserResult = userAgentParser(userAgent)
  const { device, browser, os } = userAgentParserResult
  let result = {}

  if (userAgent) {
    result = {
      device: device.vendor || getDeviceFromUserAgent(userAgent),
      browser: browser.name || '',
      browserVersion: browser.version || '',
      operatingSystem: os.name || '',
      operatingSystemVersion: os.version || ''
    }
  }

  return result
}

const createQuizAction = async (
  userId,
  quizSubcategory,
  ipAddress = '',
  action
) => {
  const userActionDoc = new UserAction({
    actionType: USER_ACTION_TYPE.QUIZ,
    action,
    user: userId,
    quizSubcategory: quizSubcategory.toUpperCase(),
    quizCategory: getSubjectType(quizSubcategory).toUpperCase(),
    ipAddress
  })

  return userActionDoc.save()
}

const createSessionAction = async (
  userId,
  sessionId,
  userAgent = '',
  ipAddress = '',
  action
) => {
  const userAgentResult = getUserAgentInfo(userAgent)
  const userActionDoc = new UserAction({
    user: userId,
    session: sessionId,
    actionType: USER_ACTION_TYPE.SESSION,
    action,
    ipAddress,
    ...userAgentResult
  })

  return userActionDoc.save()
}

// todo: refactor positional arguments to destructuring
const createAccountAction = async (
  userId,
  ipAddress = '',
  action,
  options = {}
) => {
  const userActionDoc = new UserAction({
    user: userId,
    actionType: USER_ACTION_TYPE.ACCOUNT,
    ipAddress,
    action,
    ...options
  })
  return userActionDoc.save()
}

const createAdminAction = async (userId, action, options = {}) => {
  const userActionDoc = new UserAction({
    user: userId,
    actionType: USER_ACTION_TYPE.ADMIN,
    action,
    ...options
  })
  return userActionDoc.save()
}

const startedQuiz = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ_STARTED
  )
}

const passedQuiz = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ_PASSED
  )
}

const failedQuiz = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ_FAILED
  )
}

const viewedMaterials = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ_VIEWED_MATERIALS
  )
}

const unlockedSubject = (userId, subject, ipAddress) => {
  return createQuizAction(
    userId,
    subject,
    ipAddress,
    USER_ACTION.QUIZ_UNLOCKED_SUBJECT
  )
}

const requestedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION_REQUESTED
  )
}

const repliedYesToSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION_REPLIED_YES
  )
}

const joinedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION_JOINED
  )
}

const rejoinedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION_REJOINED
  )
}

const endedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION_ENDED
  )
}

const updatedProfile = (userId, ipAddress) => {
  return createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_UPDATED_PROFILE
  )
}

const updatedAvailability = (userId, ipAddress) => {
  return createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_UPDATED_AVAILABILITY
  )
}

const createdAccount = (userId, ipAddress) => {
  return createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT_CREATED)
}

const addedPhotoId = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT_ADDED_PHOTO_ID)

const addedReference = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_ADDED_REFERENCE,
    options
  )

const completedBackgroundInfo = (userId, ipAddress) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_COMPLETED_BACKGROUND_INFO
  )

const deletedReference = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_DELETED_REFERENCE,
    options
  )

const accountApproved = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT_APPROVED)

const accountOnboarded = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT_ONBOARDED)

const accountBanned = (userId, sessionId, banReason) =>
  createAccountAction(userId, '', USER_ACTION.ACCOUNT_BANNED, {
    session: sessionId,
    banReason
  })

const accountDeactivated = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT_DEACTIVATED)

const submittedReferenceForm = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT_SUBMITTED_REFERENCE_FORM,
    options
  )

const rejectedPhotoId = userId =>
  createAccountAction(userId, '', USER_ACTION.ACCOUNT_REJECTED_PHOTO_ID)

const rejectedReference = (userId, options) =>
  createAccountAction(
    userId,
    '',
    USER_ACTION.ACCOUNT_REJECTED_REFERENCE,
    options
  )

const adminDeactivatedAccount = userId =>
  createAdminAction(userId, USER_ACTION.ACCOUNT_DEACTIVATED)

module.exports = {
  startedQuiz,
  passedQuiz,
  failedQuiz,
  viewedMaterials,
  unlockedSubject,
  requestedSession,
  joinedSession,
  rejoinedSession,
  endedSession,
  repliedYesToSession,
  updatedProfile,
  updatedAvailability,
  createdAccount,
  addedPhotoId,
  addedReference,
  completedBackgroundInfo,
  deletedReference,
  accountApproved,
  accountOnboarded,
  accountBanned,
  accountDeactivated,
  submittedReferenceForm,
  rejectedPhotoId,
  rejectedReference,
  adminDeactivatedAccount
}
