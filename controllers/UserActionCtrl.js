const UserAction = require('../models/UserAction')
const { USER_ACTION } = require('../constants')
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
    actionType: USER_ACTION.TYPE.QUIZ,
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
    actionType: USER_ACTION.TYPE.SESSION,
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
    actionType: USER_ACTION.TYPE.ACCOUNT,
    ipAddress,
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
    USER_ACTION.QUIZ.STARTED
  )
}

const passedQuiz = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ.PASSED
  )
}

const failedQuiz = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ.FAILED
  )
}

const viewedMaterials = (userId, quizCategory, ipAddress) => {
  return createQuizAction(
    userId,
    quizCategory,
    ipAddress,
    USER_ACTION.QUIZ.VIEWED_MATERIALS
  )
}

const unlockedSubject = (userId, subject, ipAddress) => {
  return createQuizAction(
    userId,
    subject,
    ipAddress,
    USER_ACTION.QUIZ.UNLOCKED_SUBJECT
  )
}

const requestedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REQUESTED
  )
}

const repliedYesToSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REPLIED_YES
  )
}

const joinedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.JOINED
  )
}

const rejoinedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REJOINED
  )
}

const endedSession = (userId, sessionId, userAgent, ipAddress) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.ENDED
  )
}

const updatedProfile = (userId, ipAddress) => {
  return createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.UPDATED_PROFILE
  )
}

const updatedAvailability = (userId, ipAddress) => {
  return createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.UPDATED_AVAILABILITY
  )
}

const createdAccount = (userId, ipAddress) => {
  return createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT.CREATED)
}

const addedPhotoId = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT.ADDED_PHOTO_ID)

const addedReference = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.ADDED_REFERENCE,
    options
  )

const completedBackgroundInfo = (userId, ipAddress) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
  )

const deletedReference = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.DELETED_REFERENCE,
    options
  )

const accountApproved = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT.APPROVED)

const accountOnboarded = (userId, ipAddress) =>
  createAccountAction(userId, ipAddress, USER_ACTION.ACCOUNT.ONBOARDED)

const submittedReferenceForm = (userId, ipAddress, options) =>
  createAccountAction(
    userId,
    ipAddress,
    USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM,
    options
  )

const rejectedPhotoId = userId =>
  createAccountAction(userId, '', USER_ACTION.ACCOUNT.REJECTED_PHOTO_ID)

const rejectedReference = (userId, options) =>
  createAccountAction(
    userId,
    '',
    USER_ACTION.ACCOUNT.REJECTED_REFERENCE,
    options
  )

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
  submittedReferenceForm,
  rejectedPhotoId,
  rejectedReference
}
