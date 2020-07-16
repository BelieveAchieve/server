const Session = require('../models/Session')
const User = require('../models/User')
const WhiteboardService = require('../services/WhiteboardService')
const crypto = require('crypto')

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
    if (session.volunteer)
      await addPastSession({
        userId: session.volunteer,
        sessionId: session._id
      })

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
  },

  getSessionPhotoUploadUrl: async sessionId => {
    const sessionPhotoS3Key = crypto.randomBytes(32).toString('hex')
    await Session.updateOne(
      { _id: sessionId },
      { $push: { photos: sessionPhotoS3Key } }
    )
    return sessionPhotoS3Key
  }
}
