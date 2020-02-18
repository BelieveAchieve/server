const cron = require('cron')
const mongoose = require('mongoose')
const Sentry = require('@sentry/node')
const config = require('../config')
const User = require('../models/User')

// Cron pattern for: "each day at 4am"
// See: https://crontab.guru/#0_4_*_*_*
const cronPatternDaily4am = '0 4 * * *'

// Schedule daily update of elapsed availability
cron.schedule(cronPatternDaily4am, async function() {
  // Connect to database
  try {
    await mongoose.connect(config.database, { useNewUrlParser: true })
  } catch (error) {
    Sentry.captureException(error)
  }

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
})

cron.start()
