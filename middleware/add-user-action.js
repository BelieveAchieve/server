const UserActionCtrl = require('../controllers/UserActionCtrl')
const Sentry = require('@sentry/node')

function addUserAction(req, res, next) {
  if (req.user) {
    const { id } = req.user

    if (req.url === '/api/calendar/save') {
      UserActionCtrl.updatedAvailability(id).catch(error =>
        Sentry.captureException(error)
      )
    }

    if (req.url === '/api/training/questions') {
      const { category } = req.body
      UserActionCtrl.startedQuiz(id, category).catch(error =>
        Sentry.captureException(error)
      )
    }

    if (req.url === '/api/user' && req.method === 'PUT') {
      UserActionCtrl.updatedProfile(id).catch(error =>
        Sentry.captureException(error)
      )
    }
  }

  next()
}

module.exports = addUserAction
