const _ = require('lodash')
const moment = require('moment')
const ObjectId = require('mongoose').Types.ObjectId

const Feedback = require('../../models/Feedback')
const Session = require('../../models/Session')
const User = require('../../models/User')

const MIN_MINUTES_FOR_SUCCESSFUL_SESSION = 1
const MAX_SESSION_LENGTH_SECONDS = 3600 * 5 // 5hr
const MIN_SESSION_LENGTH_SECONDS = 60

// timeScale is 'hour' | 'day' | 'week' | 'month' | 'all'
function getScaledTimeByTimeScale(timeScale, time) {
  if (time == null) {
    time = moment.utc()
  }
  if (timeScale === 'all') {
    return 'ALL'
  } else if (timeScale === 'day') {
    return 'DAY:' + time.format('YYYY-MM-DD')
  } else if (timeScale === 'biweek') {
    // 1 - 26 instead of 1 - 52
    return 'BIWK:' + time.format('GGGG') + parseInt(time.format('GGGG-WW')) / 2
  } else if (timeScale === 'week') {
    return 'WK:' + time.format('GGGG-WW')
  } else if (timeScale === 'month') {
    return 'MON:' + time.format('YYYY-MM')
  } else if (timeScale === 'year') {
    return 'YR:' + time.format('YYYY')
  } else {
    return 'MIN:' + time.format('YYYY-MM-DD HH:mm')
  }
}

function objToDatapoints(obj, prop = 'count') {
  return _.map(obj, (scaledTimes, segmentSlug) => {
    scaledTimes = _.mapValues(scaledTimes, prop)
    return _.map(scaledTimes, (count, scaledTime) => {
      return {
        segmentSlug,
        count,
        scaledTime,
        dimensionSlug: 'all',
        dimensionValue: 'all'
      }
    })
  })
}

function deepObjToDatapoints(obj, dimensionSlug = 'all') {
  return _.flattenDeep(
    _.map(obj, (scaledTimes, segmentSlug) => {
      scaledTimes = _.mapValues(scaledTimes, dimensionSlug)
      return _.map(scaledTimes, (deepObj, scaledTime) => {
        return _.map(deepObj, (count, dimensionValue) => {
          return {
            segmentSlug,
            count,
            scaledTime,
            dimensionSlug,
            dimensionValue
          }
        })
      })
    })
  )
}

async function getFeedbackStats(userType, options) {
  const { minTime, maxTime, timeScale = 'day' } = options
  const feedbacks = await Feedback.find({
    userType,
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select([
      'createdAt',
      'type',
      'subTopic',
      'responseData',
      'volunteerId',
      'studentId'
    ])
    .lean()

  const allUserIds = _.filter(
    _.uniq(
      _.flatten(
        _.map(feedbacks, ({ volunteerId, studentId }) => [
          volunteerId,
          studentId
        ])
      )
    )
  )
  const allUsers = await User.find({
    _id: { $in: allUserIds }
  })
    .select([
      '_id',
      'studentPartnerOrg',
      'volunteerPartnerOrg',
      'studentId',
      'volunteerId'
    ])
    .lean()

  const feedbacksWithExtras = _.map(feedbacks, feedback => {
    const student = _.find(allUsers, { _id: ObjectId(feedback.studentId) })
    const volunteer = _.find(allUsers, { _id: ObjectId(feedback.volunteerId) })
    return _.defaults(
      {
        studentPartnerOrg: student && student.studentPartnerOrg,
        volunteerPartnerOrg: volunteer && volunteer.volunteerPartnerOrg
      },
      feedback
    )
  })

  const stats = getPerSegment(
    feedbacksWithExtras,
    getFeedbackStatsPerSegment,
    timeScale
  )

  const toDatapoints = type => {
    return _.flattenDeep(
      _.map(stats, (ratings, segmentSlug) => {
        return _.map(ratings, (dimensions, dimensionSlug) => {
          return _.map(dimensions, (scaledTimes, dimensionValue) => {
            const datapoints = _.map(scaledTimes, (values, scaledTime) => {
              return {
                segmentSlug,
                dimensionSlug,
                dimensionValue,
                count: type === 'sum' ? _.sumBy(values) : values.length,
                scaledTime
              }
            })
            return _.orderBy(datapoints, 'scaledTime')
          })
        })
      })
    )
  }

  return { sum: toDatapoints('sum'), count: toDatapoints('count') }
}

function getFeedbackStatsPerSegment(
  feedbacksWithExtras,
  segmentSlug,
  timeScale
) {
  // bunch of stuff to conform to datapoint format {scaledTime, dimensionSlug, dimensionValue}
  return _.reduce(
    feedbacksWithExtras,
    (ratings, feedback) => {
      const scaledTime = getScaledTimeByTimeScale(
        timeScale,
        moment.utc(feedback.createdAt)
      )
      const rating =
        feedback.responseData &&
        feedback.responseData['rate-session'] &&
        feedback.responseData['rate-session'].rating

      if (rating && feedback.type && feedback.subTopic) {
        ratings.topic[feedback.type] = ratings.topic[feedback.type] || {}
        ratings.topic[feedback.type][scaledTime] =
          ratings.topic[feedback.type][scaledTime] || []
        ratings['sub-topic'][feedback.subTopic] =
          ratings['sub-topic'][feedback.subTopic] || {}
        ratings['sub-topic'][feedback.subTopic][scaledTime] =
          ratings['sub-topic'][feedback.subTopic][scaledTime] || []
        ratings.topic[feedback.type][scaledTime].push(rating)
        ratings['sub-topic'][feedback.subTopic][scaledTime].push(rating)
      }
      return ratings
    },
    { topic: {}, 'sub-topic': {} }
  )
}

async function getSessionStats({ minTime, maxTime, timeScale = 'day' }) {
  const sessions = await Session.find({
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select([
      'createdAt',
      'volunteerJoinedAt',
      'student',
      'volunteer',
      'endedAt',
      'messages',
      'type',
      'subTopic'
    ])
    .lean()

  const allUserIds = _.filter(
    _.uniq(
      _.flatten(
        _.map(sessions, ({ volunteer, student }) => [volunteer, student])
      )
    )
  )
  const allUsers = await User.find({
    _id: { $in: allUserIds }
  })
    .select(['_id', 'studentPartnerOrg', 'volunteerPartnerOrg'])
    .lean()

  const sessionsWithExtras = _.filter(
    await Promise.all(
      _.map(sessions, async session => {
        const startTime = moment.utc(session.createdAt)
        const endTime = moment.utc(session.endedAt)
        const hasVolunteer = Boolean(session.volunteerJoinedAt)
        let waitSeconds, durationSeconds
        if (hasVolunteer) {
          const matchedTime = moment.utc(session.volunteerJoinedAt)
          waitSeconds = matchedTime.diff(startTime, 'seconds')
          durationSeconds = endTime.diff(matchedTime, 'seconds')
        } else {
          waitSeconds = endTime.diff(startTime, 'seconds')
          durationSeconds = 0
        }

        if (
          waitSeconds > MAX_SESSION_LENGTH_SECONDS ||
          durationSeconds > MAX_SESSION_LENGTH_SECONDS ||
          (durationSeconds < MIN_SESSION_LENGTH_SECONDS && !hasVolunteer)
        ) {
          return // ignore outliers. TODO: smarter approach (based on chat messages)
        }

        const student = _.find(allUsers, { _id: session.student })
        const volunteer = _.find(allUsers, { _id: session.volunteer })

        const extras = {
          waitSeconds,
          durationSeconds,
          studentPartnerOrg: student && student.studentPartnerOrg,
          volunteerPartnerOrg: volunteer && volunteer.volunteerPartnerOrg,
          dayOfWeek: startTime.format('ddd'),
          hourOfDay: startTime.format('H'),
          isSuccessful: durationSeconds >= MIN_MINUTES_FOR_SUCCESSFUL_SESSION
        }
        return _.defaults(extras, session)
      })
    )
  )

  return getPerSegment(sessionsWithExtras, getSessionStatsPerSegment, timeScale)
}

function getSessionStatsPerSegment(sessionsWithExtras, segmentSlug, timeScale) {
  const sessionGroups = _.groupBy(sessionsWithExtras, ({ createdAt }) =>
    getScaledTimeByTimeScale(timeScale, moment.utc(createdAt))
  )

  return _.mapValues(sessionGroups, sessions => {
    const successfulSessions = _.filter(sessions, 'isSuccessful')
    return {
      count: sessions.length,
      durationSecSum: _.sumBy(sessions, 'durationSeconds'),
      waitSecSum: _.sumBy(sessions, 'waitSeconds'),
      messageSum: _.sumBy(sessions, ({ messages }) => messages.length),
      successfulMatches: successfulSessions.length,
      'day-of-week': _.countBy(sessions, 'dayOfWeek'),
      'hour-of-day': _.countBy(sessions, 'hourOfDay'),
      topic: _.countBy(sessions, 'type'),
      'sub-topic': _.countBy(sessions, 'subTopic')
    }
  })
}

function getPerSegment(rowsWithExtras, fn, timeScale, type = 'all') {
  const studentPartnerGroups = _.groupBy(
    rowsWithExtras,
    ({ studentPartnerOrg }) => `student-${studentPartnerOrg || 'none'}`
  )
  const volunteerPartnerGroups = _.groupBy(
    rowsWithExtras,
    ({ volunteerPartnerOrg }) => `volunteer-${volunteerPartnerOrg || 'none'}`
  )
  const studentPartnerStats = _.mapValues(
    studentPartnerGroups,
    (sessions, studentPartner) => fn(sessions, studentPartner, timeScale)
  )
  const volunteerPartnerStats = _.mapValues(
    volunteerPartnerGroups,
    (sessions, studentPartner) => fn(sessions, studentPartner, timeScale)
  )
  return _.merge(
    { '': fn(rowsWithExtras, '', timeScale) },
    type === 'all' || type === 'student' ? studentPartnerStats : {},
    type === 'all' || type === 'volunteer' ? volunteerPartnerStats : {}
  )
}

async function getStudents({ minTime, maxTime, timeScale = 'day' }) {
  const students = await User.find({
    isVolunteer: false,
    isTestUser: false,
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select(['createdAt', 'zipCode', 'studentPartnerOrg'])
    .lean()

  const studentPartnerGroups = _.groupBy(
    students,
    ({ studentPartnerOrg }) => `student-${studentPartnerOrg || 'none'}`
  )
  const allDatapoints = await getStudentsDatapoints(students, '', timeScale)
  const studentPartnerDatapoints = await Promise.all(
    _.map(studentPartnerGroups, (students, studentPartner) =>
      getStudentsDatapoints(students, studentPartner, timeScale)
    )
  )
  return allDatapoints.concat(_.flatten(studentPartnerDatapoints))
}

async function getStudentsDatapoints(students, segmentSlug, timeScale) {
  const studentGroups = _.groupBy(students, ({ createdAt }) =>
    getScaledTimeByTimeScale(timeScale, moment.utc(createdAt))
  )

  return _.flattenDeep(
    _.map(studentGroups, (students, scaledTime) => {
      return [
        {
          segmentSlug,
          scaledTime,
          dimensionSlug: 'all',
          dimensionValue: 'all',
          count: students.length
        }
      ].concat(
        _.filter(
          _.map(_.countBy(students, 'zipCode'), (count, zipCode) => {
            if (zipCode !== 'undefined') {
              return [
                {
                  segmentSlug,
                  scaledTime,
                  dimensionSlug: 'zip',
                  dimensionValue: zipCode,
                  count: count
                }
              ]
            }
          })
        )
      )
    })
  )
}

async function getVolunteerDistributionStats(options) {
  const { minTime, maxTime, timeScale = 'day' } = options
  const volunteers = await User.find({
    isVolunteer: true,
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select(['createdAt', 'availability', 'certifications'])
    .lean()

  // const calendar = _.reduce(
  //   volunteers,
  //   (calendar, volunteer) => {
  //     _.forEach(volunteer.availability, (hours, day) => {
  //       calendar.days[day] = calendar.days[day] || 0
  //       const hasAvailabilityToday = _.filter(hours).length > 0
  //       if (hasAvailabilityToday) {
  //         calendar.days[day] += 1
  //       }
  //       _.forEach(hours, (isSet, hour) => {
  //         calendar.hours[hour] = calendar.hours[hour] || 0
  //         if (isSet) {
  //           calendar.hours[hour] += 1
  //         }
  //       })
  //     })
  //     return calendar
  //   },
  //   { days: {}, hours: {} }
  // )

  const volunteerGroups = _.groupBy(volunteers, ({ createdAt }) =>
    getScaledTimeByTimeScale(timeScale, moment.utc(createdAt))
  )

  return _.flatten(
    _.map(volunteerGroups, (volunteers, scaledTime) => {
      const allCertifications = _.flatten(
        _.map(volunteers, volunteer => {
          return _.keys(_.pickBy(volunteer.certifications, 'passed'))
        })
      )

      const certificateCounts = _.countBy(allCertifications, _.identity)

      // dayAvailability: _.map(calendar.days, (count, day) => {
      //   return {
      //     dimensionSlug: 'day-of-week',
      //     dimensionValue: day,
      //     count: count,
      //     scaledTime: 'ALL'
      //   }
      // }),
      // hourAvailability: _.map(calendar.hours, (count, hour) => {
      //   return {
      //     dimensionSlug: 'hour-of-day',
      //     dimensionValue: hour,
      //     count: count,
      //     scaledTime: 'ALL'
      //   }
      // }),
      return _.map(certificateCounts, (count, subject) => {
        return {
          dimensionSlug: 'subject',
          dimensionValue: subject,
          count: count,
          scaledTime: scaledTime
        }
      })
    })
  )
}

async function getVolunteerStats({ minTime, maxTime, timeScale = 'day' }) {
  const volunteers = await User.find({
    isVolunteer: true,
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select([
      'createdAt',
      'certifications',
      'isOnboarded',
      'availability',
      'volunteerPartnerOrg'
    ])
    .lean()

  const volunteersWithExtras = _.map(volunteers, volunteer => {
    const extras = {
      availableHours: _.sumBy(_.values(volunteer.availability), hours =>
        _.sumBy(_.values(hours), hour => (hour ? 1 : 0))
      ),
      certificationCount: _.keys(_.pickBy(volunteer.certifications, 'passed'))
        .length
    }
    return _.defaults(extras, volunteer)
  })

  return getPerSegment(
    volunteersWithExtras,
    getVolunteerStatsPerSegment,
    timeScale,
    'volunteer'
  )
}

function getVolunteerStatsPerSegment(
  volunteersWithExtras,
  segmentSlug,
  timeScale
) {
  const volunteerGroups = _.groupBy(volunteersWithExtras, ({ createdAt }) =>
    getScaledTimeByTimeScale(timeScale, moment.utc(createdAt))
  )

  return _.mapValues(volunteerGroups, volunteers => {
    return {
      count: volunteers.length,
      onboardedCount: _.filter(
        volunteers,
        ({ availableHours, certificationCount }) =>
          availableHours > 0 && certificationCount > 0
      ).length,
      certificationSum: _.sumBy(volunteers, 'certificationCount'),
      availableHoursAvg: parseInt(_.meanBy(volunteers, 'availableHours'))
    }
  })
}

module.exports = {
  getFeedbackStats,
  getSessionStats,
  getStudents,
  getVolunteerDistributionStats,
  getVolunteerStats,
  objToDatapoints,
  deepObjToDatapoints
}
