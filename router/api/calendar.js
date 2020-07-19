const CalendarCtrl = require('../../controllers/CalendarCtrl')

module.exports = function(router) {
  router.post('/calendar/save', async function(req, res, next) {

    try {
      await CalendarCtrl.updateSchedule({
        user: req.user,
        availability: req.body.availability,
        tz: req.body.tz,
        ip: req.ip
      })
      res.json({
        msg: 'Schedule saved'
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/calendar/clear', async function(req, res, next) {
    try {
      await CalendarCtrl.clearSchedule(req.user, req.body.tz)
      res.json({
        msg: 'Schedule cleared'
      })
    } catch (error) {
      next(error)
    }
  })
}
