const moment = require('moment')
const Session = require('../models/Session')
const User = require('../models/User')
const StatsService = require('./StatsService')
const WhiteboardService = require('./WhiteboardService')

const MAX_SESSION_LENGTH_SECONDS = 3600 * 5 // 5hr
const MIN_SESSION_LENGTH_SECONDS = 60

const addPastSession = async ({ userId, sessionId }) => {
  await User.update({ _id: userId }, { $addToSet: { pastSessions: sessionId } })
}

const getSession = async sessionId => {
  return Session.findOne({ _id: sessionId })
}

const isSessionParticipant = (session, user) => {
  return [session.student, session.volunteer].some(
    participant => !!participant && user._id.equals(participant)
  )
}

const isCountableSession = (waitSeconds, durationSeconds, hasVolunteer) => {
  return (
    waitSeconds < MAX_SESSION_LENGTH_SECONDS &&
    durationSeconds < MAX_SESSION_LENGTH_SECONDS &&
    (durationSeconds > MIN_SESSION_LENGTH_SECONDS || hasVolunteer)
  )
}

const logMetrics = session => {
  const hasVolunteer = Boolean(session.volunteerJoinedAt)
  const startTime = moment.utc(session.createdAt)
  const endTime = moment.utc(session.endedAt)

  let waitSeconds, durationSeconds
  if (hasVolunteer) {
    const matchedTime = moment.utc(session.volunteerJoinedAt)
    waitSeconds = matchedTime.diff(startTime, 'seconds')
    durationSeconds = endTime.diff(matchedTime, 'seconds')
  } else {
    waitSeconds = endTime.diff(startTime, 'seconds')
    durationSeconds = 0
  }

  if (isCountableSession(waitSeconds, durationSeconds, hasVolunteer)) {
    if (hasVolunteer) {
      StatsService.increment('successful-matches')
      StatsService.updateActiveVolunteers(session.volunteer)
    }
    StatsService.increment('sessions', {
      topic: session.type,
      'sub-topic': session.subTopic,
      'hour-of-day': startTime.format('H'),
      'day-of-week': startTime.format('ddd')
    })

    StatsService.increment('session-duration', {}, durationSeconds)
    StatsService.increment('session-wait', {}, waitSeconds)
  }
  StatsService.updateActiveStudents(session.student)
}

module.exports = {
  getSession,

  endSession: async ({ sessionId, endedBy = null, isAdmin = false }) => {
    const session = await getSession(sessionId)
    if (!session) throw new Error('No session found')
    if (session.endedAt) return
    if (!isAdmin && !isSessionParticipant(session, endedBy))
      throw new Error('Only session participants can end a session')

    await addPastSession({
      userId: session.student,
      sessionId: session._id
    })
    if (session.volunteer) {
      await addPastSession({
        userId: session.volunteer,
        sessionId: session._id
      })
    }

    logMetrics(session)

    await Session.updateOne(
      { _id: session._id },
      {
        endedAt: new Date(),
        endedBy,
        whiteboardDoc: WhiteboardService.getDoc(session._id)
      }
    )

    WhiteboardService.clearDocFromCache(session._id)
  },

  isSessionFulfilled: session => {
    const hasEnded = !!session.endedAt
    const hasVolunteerJoined = !!session.volunteer

    return hasEnded || hasVolunteerJoined
  },

  /**
   * Get open sessions that were started longer ago than staleThreshold (ms)
   * Defaults to 12 hours old
   */
  getStaleSessions: async (staleThreshold = 43200000) => {
    const cutoffDate = new Date(Date.now() - staleThreshold)
    return Session.find({
      endedAt: { $exists: false },
      $expr: {
        $lt: ['$createdAt', cutoffDate]
      }
    })
      .lean()
      .exec()
  }
}
