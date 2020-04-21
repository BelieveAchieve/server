const UserAction = require('../models/UserAction')
const { USER_ACTION } = require('../constants')
const getSupercategory = require('../utils/getSupercategory')
const getDeviceFromUserAgent = require('../utils/getDeviceFromUserAgent')
const userAgentParser = require('ua-parser-js')

const createQuizAction = async (userId, quizSubcategory, action) => {
  const userActionDoc = new UserAction({
    actionType: USER_ACTION.TYPE.QUIZ,
    action,
    user: userId,
    quizSubcategory: quizSubcategory.toUpperCase(),
    quizCategory: getSupercategory(quizSubcategory)
  })

  return userActionDoc.save()
}

const createSessionAction = async (
  userId,
  sessionId,
  userAgent,
  ipAddress,
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

const createAccountAction = async (userId, action) => {
  const userActionDoc = new UserAction({
    user: userId,
    actionType: USER_ACTION.TYPE.ACCOUNT,
    action
  })
  return userActionDoc.save()
}

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

const startedQuiz = (userId, quizCategory) => {
  return createQuizAction(userId, quizCategory, USER_ACTION.QUIZ.STARTED)
}

const passedQuiz = (userId, quizCategory) => {
  return createQuizAction(userId, quizCategory, USER_ACTION.QUIZ.PASSED)
}

const failedQuiz = (userId, quizCategory) => {
  return createQuizAction(userId, quizCategory, USER_ACTION.QUIZ.FAILED)
}

const viewedMaterials = (userId, quizCategory) => {
  return createQuizAction(
    userId,
    quizCategory,
    USER_ACTION.QUIZ.VIEWED_MATERIALS
  )
}

const requestedSession = (userId, sessionId, userAgent, ipAddress = '') => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REQUESTED
  )
}

const repliedYesToSession = (
  userId,
  sessionId,
  userAgent = '',
  ipAddress = ''
) => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REPLIED_YES
  )
}

const joinedSession = (userId, sessionId, userAgent, ipAddress = '') => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.JOINED
  )
}

const rejoinedSession = (userId, sessionId, userAgent, ipAddress = '') => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.REJOINED
  )
}

const endedSession = (userId, sessionId, userAgent, ipAddress = '') => {
  return createSessionAction(
    userId,
    sessionId,
    userAgent,
    ipAddress,
    USER_ACTION.SESSION.ENDED
  )
}

const updatedProfile = userId => {
  return createAccountAction(userId, USER_ACTION.ACCOUNT.UPDATED_PROFILE)
}

const updatedAvailability = userId => {
  return createAccountAction(userId, USER_ACTION.ACCOUNT.UPDATED_AVAILABILITY)
}

const createdAccount = userId => {
  return createAccountAction(userId, USER_ACTION.ACCOUNT.CREATED)
}

module.exports = {
  startedQuiz,
  passedQuiz,
  failedQuiz,
  viewedMaterials,
  requestedSession,
  joinedSession,
  rejoinedSession,
  endedSession,
  repliedYesToSession,
  updatedProfile,
  updatedAvailability,
  createdAccount
}
