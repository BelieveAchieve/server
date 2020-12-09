const moment = require('moment')
const Session = require('../models/Session')
const User = require('../models/User')
const WhiteboardService = require('../services/WhiteboardService')
const crypto = require('crypto')
const QuillDocService = require('../services/QuillDocService')
const UserService = require('./UserService')
const MailService = require('./MailService')
const StatsService = require('./StatsService')
const { USER_BAN_REASON, SESSION_REPORT_REASON } = require('../constants')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const ObjectId = require('mongodb').ObjectId
const { USER_ACTION } = require('../constants')
const VolunteerModel = require('../models/Volunteer')
const { SESSION_FLAGS } = require('../constants')

const MAX_SESSION_LENGTH_SECONDS = 3600 * 5 // 5hr
const MIN_SESSION_LENGTH_SECONDS = 60

const hasReviewTriggerFlags = flags => {
  const excludedFlags = [
    SESSION_FLAGS.UNMATCHED,
    SESSION_FLAGS.LOW_MESSAGES,
    SESSION_FLAGS.ABSENT_USER
  ]
  let isReviewTrigger = false

  for (const flag of flags) {
    if (!excludedFlags.includes(flag)) {
      isReviewTrigger = true
      break
    }
  }

  return isReviewTrigger
}

const didParticipantsChat = (messages, studentId, volunteerId) => {
  let studentSentMessage = false
  let volunteerSentMessage = false

  for (const message of messages) {
    const messager = message.user.toString()
    if (studentId.equals(messager)) studentSentMessage = true
    if (volunteerId.equals(messager)) volunteerSentMessage = true
    if (studentSentMessage && volunteerSentMessage) break
  }

  return studentSentMessage && volunteerSentMessage
}

const getReviewFlags = session => {
  const flags = []
  const {
    messages,
    student,
    volunteer,
    createdAt,
    endedAt,
    isReported
  } = session
  const isStudentsFirstSession = student.pastSessions.length === 0
  const sessionLength =
    new Date(endedAt).getTime() - new Date(createdAt).getTime()

  if (volunteer) {
    const isFullConversation = didParticipantsChat(
      messages,
      student._id,
      volunteer._id
    )
    const isVolunteersFirstSession = volunteer.pastSessions.length === 0

    // one user never sent any messages
    if (!isFullConversation) flags.push(SESSION_FLAGS.ABSENT_USER)

    // both users messaged back and forth and less than 20 messages were sent
    if (isFullConversation && messages.length < 20)
      flags.push(SESSION_FLAGS.LOW_MESSAGES)

    // volunteer was a first time user
    if (isVolunteersFirstSession) flags.push(SESSION_FLAGS.FIRST_TIME_VOLUNTEER)

    // session was reported by the volunteer
    if (isReported) flags.push(SESSION_FLAGS.REPORTED)
  } else {
    // session duration >= 10 mins
    if (sessionLength >= 1000 * 60 * 10) flags.push(SESSION_FLAGS.UNMATCHED)
  }

  // student was a first time user and session duration >= 1
  if (isStudentsFirstSession && sessionLength >= 1000 * 60)
    flags.push(SESSION_FLAGS.FIRST_TIME_STUDENT)

  return flags
}

// Get flags for a session if there's a feedback rating <= 3 or a comment was left
const getFeedbackFlags = feedback => {
  const flags = []
  const sessionExperience = feedback['session-experience']
  const otherFeedback = feedback['other-feedback']
  const feedbackRatings = {
    studentSessionGoal: feedback['session-goal'],
    studentCoachRating: feedback['coach-rating'],
    volunteerSessionRating:
      feedback['rate-session'] && feedback['rate-session'].rating
  }

  if (sessionExperience)
    feedbackRatings.volunteerAgain =
      sessionExperience['plan-on-volunteering-again']

  for (const [key, value] of Object.entries(feedbackRatings)) {
    if (value <= 3) {
      switch (key) {
        case 'studentSessionGoal':
        case 'studentCoachRating':
          flags.push(SESSION_FLAGS.STUDENT_RATING)
          break
        case 'volunteerSessionRating':
        case 'volunteerAgain':
          flags.push(SESSION_FLAGS.VOLUNTEER_RATING)
          break
        default:
          break
      }
      break
    }
  }

  if (otherFeedback) flags.push(SESSION_FLAGS.COMMENT)

  return flags
}

const addFeedbackFlags = async ({ sessionId, flags }) => {
  if (flags.length === 0) return

  return Session.updateOne(
    { _id: sessionId },
    {
      $addToSet: { flags },
      reviewedStudent: false,
      reviewedVolunteer: false
    }
  )
}

const addPastSession = async ({ userId, sessionId }) => {
  await User.update({ _id: userId }, { $addToSet: { pastSessions: sessionId } })
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
    const segmentSlugs = [
      session.student.studentPartnerOrg,
      session.volunteer.volunteerPartnerOrg
    ]
    StatsService.increment('successful-matches', {}, { segmentSlugs })
    if (hasVolunteer) {
      StatsService.updateActiveVolunteers(session.volunteer._id)
    }
    StatsService.increment(
      'sessions',
      {
        topic: session.type,
        'sub-topic': session.subTopic,
        'hour-of-day': startTime.format('H'),
        'day-of-week': startTime.format('ddd')
      },
      { segmentSlugs }
    )

    StatsService.increment('session-duration', {}, durationSeconds, {
      segmentSlugs
    })
    StatsService.increment('session-wait', {}, waitSeconds, { segmentSlugs })
  }
  StatsService.updateActiveStudents(session.student._id)
}

const getSession = async (sessionId, projection = {}) => {
  return Session.findOne({ _id: sessionId })
    .select(projection)
    .lean()
    .exec()
}

const addFailedJoins = async ({ userId, sessionId }) => {
  await Session.update(
    { _id: sessionId },
    { $addToSet: { failedJoins: userId } }
  )
}

const updateSession = async ({
  sessionId,
  reviewedStudent,
  reviewedVolunteer
}) => {
  const update = {}
  if (reviewedStudent !== undefined) update.reviewedStudent = reviewedStudent
  if (reviewedVolunteer !== undefined)
    update.reviewedVolunteer = reviewedVolunteer

  return Session.updateOne({ _id: sessionId }, update)
}

const isSessionParticipant = (session, user) => {
  return [session.student, session.volunteer].some(
    participant => !!participant && user._id.equals(participant._id)
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

const getSessionsToReview = async ({ users, page }) => {
  const pageNum = parseInt(page) || 1
  const PER_PAGE = 15
  const skip = (pageNum - 1) * PER_PAGE

  const query = {}
  if (users === 'students') query.reviewedStudent = false
  if (users === 'volunteers') query.reviewedVolunteer = false
  if (!users)
    query.$or = [{ reviewedStudent: false }, { reviewedVolunteer: false }]

  try {
    const sessions = await Session.aggregate([
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $match: query
      },
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
        $unwind: {
          path: '$volunteer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          hasTestUser: {
            $cond: [
              {
                $or: [
                  {
                    $eq: ['$student.isTestUser', true]
                  },
                  {
                    $eq: ['$volunteer.isTestUser', true]
                  }
                ]
              },
              true,
              false
            ]
          }
        }
      },
      {
        $match: {
          hasTestUser: false
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
          studentFirstName: '$student.firstname',
          isReported: 1,
          flags: 1
        }
      }
    ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PER_PAGE)

    const isLastPage = sessions.length < PER_PAGE
    return { sessions, isLastPage }
  } catch (err) {
    throw new Error(err.message)
  }
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
    const session = await Session.findOne({ _id: sessionId })
      .populate({ path: 'student', select: 'pastSessions' })
      .populate({ path: 'volunteer', select: 'pastSessions' })
      .lean()
      .exec()

    if (!session) throw new Error('No session found')
    if (session.endedAt) return
    if (!isAdmin && !isSessionParticipant(session, endedBy))
      throw new Error('Only session participants can end a session')

    await addPastSession({
      userId: session.student._id,
      sessionId: session._id
    })

    const endedAt = new Date()

    const reviewFlags = getReviewFlags({ ...session, endedAt })
    const isReviewNeeded =
      reviewFlags.length > 0 && hasReviewTriggerFlags(reviewFlags)
    const update = {
      flags: reviewFlags
    }

    if (isReviewNeeded) update.reviewedStudent = false

    if (session.volunteer) {
      const hoursTutored = calculateHoursTutored({ ...session, endedAt })
      await VolunteerModel.updateOne(
        { _id: session.volunteer._id },
        { $addToSet: { pastSessions: session._id }, $inc: { hoursTutored } }
      )

      if (isReviewNeeded) update.reviewedVolunteer = false
    }

    logMetrics(session)

    const quillDoc = await QuillDocService.getDoc(session._id.toString())
    const whiteboardDoc = await WhiteboardService.getDoc(session._id.toString())

    await Session.updateOne(
      { _id: session._id },
      {
        endedAt,
        endedBy,
        whiteboardDoc: whiteboardDoc || undefined,
        quillDoc: quillDoc ? JSON.stringify(quillDoc) : undefined,
        ...update
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
   * The worker runs this function every 2 hours at minute 0
   *
   * Get open sessions that were started longer ago than staleThreshold (ms)
   * but no later than the staleThreshold - cron job schedule time
   *
   * Defaults to 12 hours old
   */
  getStaleSessions: async (staleThreshold = 43200000) => {
    const cutoffDate = Date.now() - staleThreshold
    const cronJobScheduleTime = 1000 * 60 * 60 * 2 // 2 hours
    const lastCheckedCreatedAtTime = cutoffDate - cronJobScheduleTime

    return Session.find({
      endedAt: { $exists: false },
      createdAt: {
        $lte: new Date(cutoffDate),
        $gte: new Date(lastCheckedCreatedAtTime)
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
  getFeedbackFlags,
  addFeedbackFlags,
  getSessionsToReview,
  updateSession,
  addFailedJoins,

  // Session Service helpers exposed for testing
  didParticipantsChat,
  getReviewFlags,
  calculateHoursTutored
}
