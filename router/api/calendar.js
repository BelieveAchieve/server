var CalendarCtrl = require('../../controllers/CalendarCtrl')

module.exports = function (router) {
  router.post('/calendar/save', function (req, res, next) {
    CalendarCtrl.updateAvailability(
      { userid: req.user._id, availability: req.body.availability },
      function (err, avail) {
        if (err) {
          next(err)
        } else {
          res.json({
            msg: 'Availability saved'
          })
        }
      }
    )
  })
  router.post('/calendar/tz/save', function (req, res, next) {
    CalendarCtrl.updateTimezone(
      { userid: req.user._id, tz: req.body.tz },
      function (err, tz) {
        if (err) {
          next(err)
        } else {
          res.json({
            msg: 'Timezone saved'
          })
        }
      }
    )
  })
}
