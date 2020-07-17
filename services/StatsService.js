const crypto = require('crypto')
const Sentry = require('@sentry/node')
const { init, incrementMetric, incrementUnique } = require('@techby/impact')
const config = require('../config')

init({
  apiKey: config.impactApiKey
})

const hashUserIdForMetrics = userId => {
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest('base64')
}

module.exports = {
  increment: (metricSlug, dimensions) => {
    console.log('inc', metricSlug, dimensions)
    try {
      incrementMetric(metricSlug, dimensions)
    } catch (err) {
      Sentry.captureException(err)
    }
  },

  updateActiveStudents: userId => {
    console.log('inc stud', userId)
    try {
      incrementUnique('active-students', hashUserIdForMetrics(userId))
    } catch (err) {
      Sentry.captureException(err)
    }
  },

  updateActiveVolunteers: userId => {
    console.log('inc vol', userId)
    incrementUnique('active-volunteers', hashUserIdForMetrics(userId))
  },

  updateOnboardedVolunteers: userId => {
    console.log('inc onb vol', userId)
    try {
      incrementUnique('onboarded-volunteers', hashUserIdForMetrics(userId))
    } catch (err) {
      Sentry.captureException(err)
    }
  }
}
