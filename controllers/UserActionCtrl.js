const UserAction = require('../models/UserAction')
const { USER_ACTION } = require('../constants')

const createQuizAction = async (
  userId,
  quizCategory,
  quizSubCategory,
  action
) => {
  const userActionDoc = new UserAction({
    actionType: USER_ACTION.TYPE.QUIZ,
    action,
    user: userId,
    quizCategory,
    quizSubCategory
  })

  return userActionDoc.save()
}

const createSessionAction = async (userId, sessionId, action) => {
  const userActionDoc = new UserAction({
    user: userId,
    session: sessionId,
    actionType: USER_ACTION.TYPE.SESSION,
    action
  })

  return userActionDoc.save()
}

const createProfileAction = async (userId, action) => {
  const userActionDoc = new UserAction({
    user: userId,
    actionType: USER_ACTION.TYPE.PROFILE,
    action
  })
  return userActionDoc.save()
}

const startedQuiz = (userId, quizCategory, quizSubCategory) => {
  return createQuizAction(
    userId,
    quizCategory,
    quizSubCategory,
    USER_ACTION.QUIZ.STARTED
  )
}

const passedQuiz = (userId, quizCategory, quizSubCategory) => {
  return createQuizAction(
    userId,
    quizCategory,
    quizSubCategory,
    USER_ACTION.QUIZ.PASSED
  )
}

const failedQuiz = (userId, quizCategory, quizSubCategory) => {
  return createQuizAction(
    userId,
    quizCategory,
    quizSubCategory,
    USER_ACTION.QUIZ.FAILED
  )
}

// !!! @TODO - Hook into an endpoint
const requestedSession = (userId, sessionId) => {
  return createSessionAction(userId, sessionId, USER_ACTION.SESSION.REQUESTED)
}

// !!! @TODO - Hook into an endpoint
const repliedYesToSession = (userId, sessionId) => {
  return createSessionAction(userId, sessionId, USER_ACTION.SESSION.REPLIED_YES)
}

// !!! @TODO - Hook into an endpoint
const joinedSession = (userId, sessionId) => {
  return createSessionAction(userId, sessionId, USER_ACTION.SESSION.JOINED)
}

const updatedProfile = userId => {
  return createProfileAction(userId, USER_ACTION.PROFILE.UPDATED_PROFILE)
}

const updatedAvailability = userId => {
  return createProfileAction(userId, USER_ACTION.PROFILE.UPDATED_AVAILABILITY)
}

module.exports = {
  startedQuiz,
  passedQuiz,
  failedQuiz,
  requestedSession,
  joinedSession,
  repliedYesToSession,
  updatedProfile,
  updatedAvailability
}
