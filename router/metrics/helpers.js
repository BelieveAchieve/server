const _ = require('lodash')
const moment = require('moment')

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

function objToDatapoints(obj) {
  const datapoints = _.map(obj, (count, scaledTime) => {
    return { count, scaledTime, dimensionSlug: 'all', dimensionValue: 'all' }
  })
  return _.orderBy(datapoints, 'scaledTime')
}

function deepObjToDatapoints(obj, dimensionSlug = 'all') {
  const datapoints = _.flatten(
    _.map(obj, (deepObj, scaledTime) => {
      return _.map(deepObj, (count, dimensionValue) => {
        return { count, scaledTime, dimensionSlug, dimensionValue }
      })
    })
  )
  return _.orderBy(datapoints, 'scaledTime')
}

async function getFeedbackStats({ minTime, maxTime, timeScale = 'day' }) {
  const feedbacks = await Feedback.find({
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select(['createdAt', 'type', 'subTopic', 'responseData'])
    .lean()

  // bunch of stuff to conform to datapoint format {scaledTime, dimensionSlug, dimensionValue}
  const ratings = _.reduce(
    feedbacks,
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

  const toDatapoints = type => {
    return _.flattenDeep(
      _.map(ratings, (dimensions, dimensionSlug) => {
        return _.map(dimensions, (scaledTimes, dimensionValue) => {
          const datapoints = _.map(scaledTimes, (values, scaledTime) => {
            // TODO: group by scaled time
            return {
              dimensionSlug,
              dimensionValue,
              count: type === 'sum' ? _.sumBy(values) : values.length,
              scaledTime
            }
          })
          return _.orderBy(datapoints, 'scaledTime')
        })
      })
    )
  }

  return { sum: toDatapoints('sum'), count: toDatapoints('count') }
}

async function getSessionStats({ minTime, maxTime, timeScale = 'day' }) {
  const sessions = await Session.find({
    createdAt: { $gte: minTime, $lte: maxTime }
  }).select([
    'createdAt',
    'volunteerJoinedAt',
    'endedAt',
    'messages',
    'type',
    'subTopic'
  ])

  const sessionsWithExtras = _.filter(
    _.map(sessions, session => {
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

      const extras = {
        waitSeconds,
        durationSeconds,
        dayOfWeek: startTime.format('ddd'),
        hourOfDay: startTime.format('H'),
        isSuccessful: durationSeconds >= MIN_MINUTES_FOR_SUCCESSFUL_SESSION
      }
      return _.defaults(extras, session)
    })
  )

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
      requestsByDayOfWeek: _.countBy(sessions, 'dayOfWeek'),
      requestsByHourOfDay: _.countBy(sessions, 'hourOfDay'),
      requestsByTopic: _.countBy(sessions, 'type'),
      requestsBySubTopic: _.countBy(sessions, 'subTopic')
    }
  })
}

async function getStudents({ minTime, maxTime, timeScale = 'day' }) {
  const students = await User.find({
    isVolunteer: false,
    isTestUser: false,
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select(['createdAt', 'zipCode'])
    .lean()

  const studentGroups = _.groupBy(students, ({ createdAt }) =>
    getScaledTimeByTimeScale(timeScale, moment.utc(createdAt))
  )

  return _.flattenDeep(
    _.map(studentGroups, (students, scaledTime) => {
      return [
        {
          scaledTime,
          dimensionSlug: 'all',
          dimensionValue: 'all',
          count: students.length
        }
      ].concat(
        _.filter(
          _.map(_.countBy(students, 'zipCode'), (count, zipCode) => {
            console.log('count', count, zipCode)
            if (zipCode !== 'undefined') {
              return [
                {
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
    // isTestUser: false, // FIXME
    createdAt: { $gte: minTime, $lte: maxTime }
  })
    .select(['createdAt', 'certifications', 'isOnboarded', 'availability'])
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
