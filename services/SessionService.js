const Session = require('../models/Session')
const User = require('../models/User')
const WhiteboardService = require('../services/WhiteboardService')
const crypto = require('crypto')
const QuillDocService = require('../services/QuillDocService')
const UserService = require('./UserService')
const MailService = require('./MailService')
const { USER_BAN_REASON, SESSION_REPORT_REASON } = require('../constants')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const ObjectId = require('mongodb').ObjectId
const { USER_ACTION } = require('../constants')
const VolunteerModel = require('../models/Volunteer')

const addPastSession = async ({ userId, sessionId }) => {
  await User.update({ _id: userId }, { $addToSet: { pastSessions: sessionId } })
}

const getSession = async sessionId => {
  return Session.findOne({ _id: sessionId })
    .lean()
    .exec()
}

const isSessionParticipant = (session, user) => {
  return [session.student, session.volunteer].some(
    participant => !!participant && user._id.equals(participant)
  )
}

const calculateHoursTutored = session => {
  const threeHoursMs = 1000 * 60 * 60 * 3
  const fifteenMinsMs = 1000 * 60 * 15

  const { volunteerJoinedAt, endedAt, messages, volunteer } = session
  if (!volunteer) return 0
  // skip if no messages are sent
  if (messages.length === 0) return 0

  const volunteerJoinDate = new Date(volunteerJoinedAt)
  const sessionEndDate = new Date(endedAt)
  let sessionLengthMs = sessionEndDate - volunteerJoinDate

  // skip if volunteer joined after the session ended
  if (sessionLengthMs < 0) return 0

  let latestMessageIndex = messages.length - 1
  let wasMessageSentAfterSessionEnded =
    messages[latestMessageIndex].createdAt > sessionEndDate

  // get the latest message that was sent within a 15 minute window of the message prior.
  // Sometimes sessions are not ended by either participant and one of the participants may send
  // a message to see if the other participant is still active before ending the session.
  // Exclude these messages when getting the total session end time
  if (sessionLengthMs > threeHoursMs || wasMessageSentAfterSessionEnded) {
    while (
      latestMessageIndex > 0 &&
      (wasMessageSentAfterSessionEnded ||
        messages[latestMessageIndex].createdAt -
          messages[latestMessageIndex - 1].createdAt >
          fifteenMinsMs)
    ) {
      latestMessageIndex--
      wasMessageSentAfterSessionEnded =
        messages[latestMessageIndex].createdAt > sessionEndDate
    }
  }

  const latestMessageDate = new Date(messages[latestMessageIndex].createdAt)

  // skip if the latest message was sent before a volunteer joined
  // or skip if the only messages that were sent were after a session has ended
  if (latestMessageDate <= volunteerJoinDate || wasMessageSentAfterSessionEnded)
    return 0

  sessionLengthMs = latestMessageDate - volunteerJoinDate

  // milliseconds in an hour = (60,000 * 60) = 3,600,000
  return Number((sessionLengthMs / 3600000).toFixed(2))
}

module.exports = {
  getSession,

  reportSession: async ({
    session,
    reportedBy,
    reportReason,
    reportMessage
  }) => {
    await Session.updateOne(
      { _id: session._id },
      { isReported: true, reportReason, reportMessage }
    )

    const isBanReason =
      reportReason === SESSION_REPORT_REASON.STUDENT_RUDE ||
      reportReason === SESSION_REPORT_REASON.STUDENT_MISUSE
    if (isBanReason && reportedBy.isVolunteer) {
      await UserService.banUser({
        userId: session.student,
        banReason: USER_BAN_REASON.SESSION_REPORTED
      })
      MailService.sendBannedUserAlert({
        userId: session.student,
        banReason: USER_BAN_REASON.SESSION_REPORTED,
        sessionId: session._id
      })
      UserActionCtrl.accountBanned(
        session.student,
        session._id,
        USER_BAN_REASON.SESSION_REPORTED
      )
      const student = await UserService.getUser({ _id: session.student })
      // Update user in the SendGrid contact list with banned status
      MailService.createContact(student)
    }

    MailService.sendReportedSessionAlert({
      sessionId: session._id,
      reportedByEmail: reportedBy.email,
      reportReason,
      reportMessage
    })
  },

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

    const endedAt = new Date()

    if (session.volunteer) {
      const hoursTutored = calculateHoursTutored({ ...session, endedAt })
      await VolunteerModel.updateOne(
        { _id: session.volunteer },
        { $addToSet: { pastSessions: session._id }, $inc: { hoursTutored } }
      )
    }

    const quillDoc = await QuillDocService.getDoc(session._id.toString())
    const whiteboardDoc = await WhiteboardService.getDoc(session._id.toString())

    await Session.updateOne(
      { _id: session._id },
      {
        endedAt,
        endedBy,
        whiteboardDoc: whiteboardDoc || undefined,
        quillDoc: quillDoc ? JSON.stringify(quillDoc) : undefined
      }
    )

    WhiteboardService.deleteDoc(session._id.toString())
    QuillDocService.deleteDoc(session._id.toString())
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
    const sessionPhotoS3Key = `${sessionId}${crypto
      .randomBytes(8)
      .toString('hex')}`
    await Session.updateOne(
      { _id: sessionId },
      { $push: { photos: sessionPhotoS3Key } }
    )
    return sessionPhotoS3Key
  },

  getPublicSession: async sessionId => {
    return Session.aggregate([
      { $match: { _id: ObjectId(sessionId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'volunteer',
          foreignField: '_id',
          as: 'volunteer'
        }
      },
      {
        $unwind: '$volunteer'
      },
      {
        $project: {
          student: '$student.firstname',
          volunteer: '$volunteer.firstname',
          type: 1,
          subTopic: 1,
          createdAt: 1,
          endedAt: 1
        }
      }
    ])
  },

  getFilteredSessions: async function({
    showBannedUsers,
    showTestUsers,
    minSessionLength,
    sessionActivityFrom,
    sessionActivityTo,
    minMessagesSent,
    studentRating,
    volunteerRating,
    firstTimeStudent,
    firstTimeVolunteer,
    isReported,
    page
  }) {
    const PER_PAGE = 15
    const pageNum = parseInt(page) || 1
    const skip = (pageNum - 1) * PER_PAGE
    const oneDayInMS = 1000 * 60 * 60 * 24
    const estTimeOffset = 1000 * 60 * 60 * 4

    // Add a day to the sessionActivityTo to make it inclusive for the activity range: [sessionActivityFrom, sessionActivityTo]
    const inclusiveSessionActivityTo =
      new Date(sessionActivityTo).getTime() + oneDayInMS + estTimeOffset
    const offsetSessionActivityFrom =
      new Date(sessionActivityFrom).getTime() + estTimeOffset

    const sessionQueryFilter = {
      // Filter by the length of a session
      sessionLength: { $gte: parseInt(minSessionLength) * 60000 }
    }
    if (isReported) sessionQueryFilter.isReported = true

    const ratingQueryFilter = {}
    if (Number(studentRating))
      ratingQueryFilter.studentRating = Number(studentRating)
    if (Number(volunteerRating))
      ratingQueryFilter.volunteerRating = Number(volunteerRating)

    const userQueryFilter = {
      'student.isTestUser': showTestUsers ? { $in: [true, false] } : false
    }
    if (firstTimeStudent && firstTimeVolunteer) {
      userQueryFilter.$or = [
        { 'student.totalPastSessions': 1 },
        { 'volunteer.totalPastSessions': 1 }
      ]
    } else if (firstTimeStudent) {
      userQueryFilter['student.totalPastSessions'] = 1
    } else if (firstTimeVolunteer) {
      userQueryFilter['volunteer.totalPastSessions'] = 1
    }

    try {
      const sessions = await Session.aggregate([
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $match: {
            // Filter by a specific date range the sessions took place
            createdAt: {
              $gte: new Date(offsetSessionActivityFrom),
              $lte: new Date(inclusiveSessionActivityTo)
            },
            // Filter a session by the amount of messages sent
            $expr: {
              $gte: [{ $size: '$messages' }, parseInt(minMessagesSent)]
            }
          }
        },
        {
          $project: {
            createdAt: 1,
            endedAt: 1,
            volunteer: { $ifNull: ['$volunteer', null] },
            totalMessages: { $size: '$messages' },
            type: 1,
            subTopic: 1,
            student: 1,
            isReported: 1
          }
        },
        {
          $addFields: {
            // Add the length of a session on the session documents
            sessionLength: {
              $cond: {
                if: { $ifNull: ['$endedAt', undefined] },
                then: { $subtract: ['$endedAt', '$createdAt'] },
                // $$NOW is a mongodb system variable which returns the current time
                else: { $subtract: ['$$NOW', '$createdAt'] }
              }
            },
            volunteer: {
              $cond: {
                if: { $ifNull: ['$volunteer', undefined] },
                then: '$volunteer',
                else: null
              }
            }
          }
        },
        {
          $match: sessionQueryFilter
        },
        {
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'sessionId',
            as: 'feedbacks'
          }
        },
        // add student and volunteer feedback if present
        {
          $addFields: {
            studentFeedback: {
              $filter: {
                input: '$feedbacks',
                as: 'feedback',
                cond: { $eq: ['$$feedback.userType', 'student'] }
              }
            },
            volunteerFeedback: {
              $filter: {
                input: '$feedbacks',
                as: 'feedback',
                cond: { $eq: ['$$feedback.userType', 'volunteer'] }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$studentFeedback',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$volunteerFeedback',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            studentRating: {
              $cond: {
                if: '$studentFeedback.responseData.rate-session.rating',
                then: '$studentFeedback.responseData.rate-session.rating',
                else: null
              }
            },
            volunteerRating: {
              $cond: {
                if: '$volunteerFeedback.responseData.rate-session.rating',
                then: '$volunteerFeedback.responseData.rate-session.rating',
                else: null
              }
            }
          }
        },
        {
          $match: ratingQueryFilter
        },
        {
          $lookup: {
            from: 'users',
            let: {
              studentId: '$student'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$studentId']
                  }
                }
              },
              {
                $project: {
                  firstname: 1,
                  isBanned: 1,
                  isTestUser: 1,
                  totalPastSessions: { $size: '$pastSessions' }
                }
              }
            ],
            as: 'student'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $lookup: {
            from: 'users',
            let: {
              volunteerId: '$volunteer'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$volunteerId']
                  }
                }
              },
              {
                $project: {
                  firstname: 1,
                  totalPastSessions: { $size: '$pastSessions' }
                }
              }
            ],
            as: 'volunteer'
          }
        },
        {
          $unwind: {
            path: '$volunteer',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: userQueryFilter
        },
        {
          $lookup: {
            from: 'useractions',
            let: { userId: '$student._id' },
            pipeline: [
              // Get user actions with 'BANNED' per session
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $eq: ['$action', USER_ACTION.ACCOUNT.BANNED] }
                    ]
                  }
                }
              }
            ],
            as: 'bannedUserAction'
          }
        },
        {
          $addFields: {
            // Retrieve the most recent 'BANNED' user action
            lastBannedAt: { $max: '$bannedUserAction.createdAt' }
          }
        },
        {
          // Show sessions that were created before a user has been banned
          // If showBannedUsers is true, show all sessions up to chosen date
          $addFields: {
            showSession: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$lastBannedAt', undefined] },
                    { $eq: ['$student.isBanned', false] }
                  ]
                },
                then: true,
                else: {
                  $cond: [
                    {
                      $lte: [
                        '$createdAtEstTime',
                        showBannedUsers
                          ? new Date(inclusiveSessionActivityTo)
                          : '$lastBannedAt'
                      ]
                    },
                    true,
                    false
                  ]
                }
              }
            }
          }
        },
        {
          $match: {
            showSession: true
          }
        },
        {
          $skip: skip
        },
        {
          $limit: PER_PAGE
        },
        {
          $project: {
            createdAt: 1,
            endedAt: 1,
            volunteer: 1,
            totalMessages: 1,
            type: 1,
            subTopic: 1,
            student: 1,
            studentFirstName: '$student.firstname',
            studentRating: 1
          }
        }
      ])

      const isLastPage = sessions.length < PER_PAGE

      return { sessions, isLastPage }
    } catch (err) {
      throw new Error(err.message)
    }
  },

  calculateHoursTutored
}
