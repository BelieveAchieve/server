const CronJob = require('cron').CronJob
const mongoose = require('mongoose')
const Sentry = require('@sentry/node')
const config = require('../config')
const User = require('../models/User')

// Cron pattern for: "each day at 4am"
// See: https://crontab.guru/#0_4_*_*_*
const cronPatternDaily4am = '0 4 * * *'

// Schedule daily update of elapsed availability
const elapsedAvailabilityJob = new CronJob(
  cronPatternDaily4am,
  async function() {
    // Fetch volunteers
    const volunteers = await User.find({ isVolunteer: true })

    // Update elapsed availability
    await Promise.all(
      volunteers.map(volunteer => {
        const currentTime = Date.now()
        const newElapsedAvailability = volunteer.calculateElapsedAvailability(
          currentTime
        )

        volunteer.elapsedAvailability += newElapsedAvailability
        volunteer.availabilityLastModifiedAt = currentTime

        return volunteer.save()
      })
    ).catch(error => {
      Sentry.captureException(error)
    })
  },
  null,
  false,
  'America/New_York'
)

const startCronJobs = () => {
  elapsedAvailabilityJob.start()
}

module.exports = startCronJobs
