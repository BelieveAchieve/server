const UserActionCtrl = require('../controllers/UserActionCtrl')

function addUserAction(req, res, next) {
  if (req.user) {
    const { id } = req.user

    if (req.url === '/api/calendar/save') {
      UserActionCtrl.updatedAvailability(id)
    }

    if (req.url === '/api/training/questions') {
      const { category } = req.body
      UserActionCtrl.startedQuiz(id, category)
    }

    if (req.url === '/api/user' && req.method === 'PUT') {
      UserActionCtrl.updatedProfile(id)
    }
  }

  next()
}

module.exports = addUserAction
