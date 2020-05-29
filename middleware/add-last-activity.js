const User = require('../models/User')

function addLastActivity(req, res, next) {
  if (req.user) {
    const { _id, lastActivityAt } = req.user
    const todaysDateInMS = Date.now()
    const oneDayElapsed = 1000 * 60 * 60 * 24
    const lastActivityInMS = new Date(lastActivityAt).getTime()

    if (lastActivityInMS + oneDayElapsed <= todaysDateInMS) {
      const todaysDateFormatted = new Date(todaysDateInMS)
      User.updateOne({ _id }, { lastActivityAt: todaysDateFormatted })
        .then(() => next())
        .catch(err => next(err))
    } else {
      next()
    }
  } else {
    next()
  }
}

module.exports = addLastActivity
