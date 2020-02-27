const CalendarCtrl = require('../../controllers/CalendarCtrl')

module.exports = function(router) {
  router.post('/calendar/save', function(req, res, next) {
    CalendarCtrl.updateSchedule(
      {
        user: req.user,
        availability: req.body.availability,
        tz: req.body.tz
      },
      function(err) {
        if (err) {
          next(err)
        } else {
          res.json({
            msg: 'Schedule saved'
          })
        }
      }
    )
  })

  router.post('/calendar/clear', function(req, res, next) {
    CalendarCtrl.clearSchedule(req.user, function(err) {
      if (err) {
        next(err)
      } else {
        res.json({
          msg: 'Schedule cleared'
        })
      }
    })
  })
}
