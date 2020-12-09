const _ = require('lodash')
const moment = require('moment')

const {
  getFeedbackStats,
  getCumulativeSessions,
  getSessionStats,
  getCumulativeStudents,
  getStudents,
  getVolunteerDistributionStats,
  getVolunteerStats,
  objToDatapoints,
  deepObjToDatapoints
} = require('./helpers')

module.exports = function(app) {
  app.use('/metrics', async function(req, res) {
    let { minTime, maxTime, timeScale } = req.query
    if (minTime) {
      minTime = moment.utc(minTime)
    }
    if (maxTime) {
      maxTime = moment.utc(maxTime).endOf('day')
    }
    const options = { minTime, maxTime, timeScale }
    const studentFeedbackStats = await getFeedbackStats('student', options)
    const volunteerFeedbackStats = await getFeedbackStats('volunteer', options)
    const sessionStats = await getSessionStats(options)
    const volunteerStats = await getVolunteerStats(options)
    const volunteerDistributionStats = await getVolunteerDistributionStats(
      options
    )

    const metrics = [
      {
        slug: 'students',
        name: 'Student signups',
        datapoints: await getStudents(options)
      },
      {
        slug: 'cumulative-students', // FIXME probably need a daily cron to update this? or have impact handle it
        name: 'Total Students',
        datapoints: await getCumulativeStudents(options)
      },
      {
        slug: 'cumulative-sessions', // FIXME probably need a daily cron to update this? or have impact handle it
        name: 'Total Sessions',
        datapoints: await getCumulativeSessions(options)
      },
      {
        slug: 'sessions',
        name: 'Sessions',
        datapoints: _.flattenDeep([
          objToDatapoints(sessionStats),
          deepObjToDatapoints(sessionStats, 'day-of-week'),
          deepObjToDatapoints(sessionStats, 'hour-of-day'),
          deepObjToDatapoints(sessionStats, 'topic'),
          deepObjToDatapoints(sessionStats, 'sub-topic')
        ])
      },
      {
        slug: 'volunteers',
        name: 'Volunteers',
        datapoints: _.flattenDeep(objToDatapoints(volunteerStats))
      },
      {
        slug: 'onboarded-volunteers',
        name: 'Onboarded volunteers',
        // passed a quiz & selected availability
        datapoints: _.flattenDeep(
          objToDatapoints(volunteerStats, 'onboardedCount')
        )
      },
      // {
      //   slug: 'volunteer-rating', // "volunteer again" rating
      //   name: '"Volunteer again" rating',
      //   datapoints: [] // FIXME
      // },
      // {
      //   slug: 'certifications', // for certs per volunteer
      //   name: 'Certifications',
      //   datapoints: objToDatapoints(
      //     _.mapValues(volunteerStats, 'certificationSum')
      //   )
      // },
      // {
      //   slug: 'available-hours-per-volunteer',
      //   name: 'Available hours per volunteer',
      //   datapoints: objToDatapoints(
      //     _.mapValues(volunteerStats, 'availableHoursAvg')
      //   )
      // },
      // {
      //   slug: 'volunteer-available-days',
      //   name: 'Volunteer availabile days',
      //   datapoints: volunteerDistributionStats.dayAvailability
      // },
      // {
      //   slug: 'volunteer-available-hours',
      //   name: 'Volunteer availabile hours',
      //   datapoints: volunteerDistributionStats.hourAvailability
      // },
      {
        slug: 'certified-volunteers',
        name: 'Certified volunteers per subject',
        datapoints: volunteerDistributionStats
      },

      // // sessions
      {
        slug: 'session-duration',
        name: 'Session duration (sec)',
        datapoints: _.flattenDeep(
          objToDatapoints(sessionStats, 'durationSecSum')
        )
      },
      {
        slug: 'session-wait',
        name: 'Session wait (sec)',
        datapoints: _.flattenDeep(objToDatapoints(sessionStats, 'waitSecSum'))
      },
      {
        slug: 'successful-matches',
        name: 'Successful matches',
        // % of sessions that lasted at least 1 min long were matched with volunteer
        datapoints: _.flattenDeep(
          objToDatapoints(sessionStats, 'successfulMatches')
        )
      },
      {
        slug: 'chat-messages',
        name: 'Chat messages',
        datapoints: _.flattenDeep(objToDatapoints(sessionStats, 'messageSum'))
      },
      {
        slug: 'session-rating',
        name: 'Session rating',
        datapoints: studentFeedbackStats.sum
      },
      {
        slug: 'session-ratings',
        name: 'Session rating count',
        datapoints: studentFeedbackStats.count
      },
      {
        slug: 'volunteer-session-rating',
        name: 'Session rating',
        datapoints: volunteerFeedbackStats.sum
      },
      {
        slug: 'volunteer-session-ratings',
        name: 'Session rating count',
        datapoints: volunteerFeedbackStats.count
      }
      // requestsByDayOfWeek: _.mapValues(sessionStats, 'requestsByDayOfWeek'),
      // requestsByHour: _.mapValues(sessionStats, 'requestsByHourOfDay'),
      // subjectsRequested: ''
    ]

    res.json(metrics)
  })
}
