const _ = require('lodash')
const moment = require('moment')

const {
  getFeedbackStats,
  getSessionStats,
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
    const feedbackStats = await getFeedbackStats(options)
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
        slug: 'sessions',
        name: 'Sessions',
        datapoints: objToDatapoints(_.mapValues(sessionStats, 'count')).concat(
          deepObjToDatapoints(
            _.mapValues(sessionStats, 'requestsByDayOfWeek'),
            'day-of-week'
          ),
          deepObjToDatapoints(
            _.mapValues(sessionStats, 'requestsByHourOfDay'),
            'hour-of-day'
          ),
          deepObjToDatapoints(
            _.mapValues(sessionStats, 'requestsByTopic'),
            'topic'
          ),
          deepObjToDatapoints(
            _.mapValues(sessionStats, 'requestsBySubTopic'),
            'sub-topic'
          )
        )
      },
      {
        slug: 'volunteers',
        name: 'Volunteers',
        datapoints: objToDatapoints(_.mapValues(volunteerStats, 'count'))
      },
      {
        slug: 'onboarded-volunteers',
        name: 'Onboarded volunteers',
        // passed a quiz & selected availability
        datapoints: objToDatapoints(
          _.mapValues(volunteerStats, 'onboardedCount')
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
        datapoints: objToDatapoints(_.mapValues(sessionStats, 'durationSecSum'))
      },
      {
        slug: 'session-wait',
        name: 'Session wait (sec)',
        datapoints: objToDatapoints(_.mapValues(sessionStats, 'waitSecSum'))
      },
      {
        slug: 'successful-matches',
        name: 'Successful matches',
        // % of sessions that lasted at least 1 min long were matched with volunteer
        datapoints: objToDatapoints(
          _.mapValues(sessionStats, 'successfulMatches')
        )
      },
      {
        slug: 'chat-messages',
        name: 'Chat messages',
        datapoints: objToDatapoints(_.mapValues(sessionStats, 'messageSum'))
      },
      {
        slug: 'session-rating',
        name: 'Session rating',
        datapoints: feedbackStats.sum // objToDatapoints(_.mapValues(feedbackStats, 'ratingAvg'))
      },
      {
        slug: 'session-ratings',
        name: 'Session rating count',
        datapoints: feedbackStats.count // objToDatapoints(_.mapValues(feedbackStats, 'ratingAvg'))
      }
      // requestsByDayOfWeek: _.mapValues(sessionStats, 'requestsByDayOfWeek'),
      // requestsByHour: _.mapValues(sessionStats, 'requestsByHourOfDay'),
      // subjectsRequested: ''
    ]

    res.json(metrics)
  })
}
