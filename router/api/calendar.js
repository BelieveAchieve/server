var CalendarCtrl = require('../../controllers/CalendarCtrl');

module.exports = function(router){
  router.post('/calendar/init', function(req, res){
    CalendarCtrl.initAvailability({userid: req.body.userid}, function(err){
      if (err){
        res.json({err: err});
      } else {
        res.json({
          msg: 'Availability initialized'
        });
      }
    });
  });
  router.post('/calendar/get', function(req, res){
    CalendarCtrl.getAvailability({userid: req.body.userid}, function(err, availability){
      if (err){
        res.json({err: err});
      } else {
        res.json({
          msg: 'Availability retrieved',
          availability: availability
        });
      }
    });
  });
  router.post('/calendar/save', function(req, res){
    CalendarCtrl.updateAvailability({userid: req.body.userid, availability: req.body.availability}, function(err, avail){
      if (err){
        res.json({err: err});
      } else {
        res.json({
          msg: 'Availability saved'
        });
      }
    });
  });
  router.post('/calendar/tz/get', function(req, res){
    CalendarCtrl.getTimezone({userid: req.body.userid}, function(err, tz){
      if (err){
        res.json({err: err});
      } else {
        res.json({
          msg: 'Timezone retrieved',
          tz: tz
        });
      }
    });
  });
  router.post('/calendar/tz/save', function(req, res){
    CalendarCtrl.updateTimezone({userid: req.body.userid, tz: req.body.tz}, function(err, tz){
      if (err) {
        res.json({err: err});
      } else {
        res.json({
          msg: 'Timezone saved'
        });
      }
    });
  });
};
