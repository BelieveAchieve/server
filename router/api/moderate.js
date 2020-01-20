const ModerationCtrl = require('../../controllers/ModerationCtrl')

module.exports = router => {
  router.route('/moderate/message').post((req, res, next) => {
    ModerationCtrl.moderateMessage(req.body, (err, isClean) => {
      if (err) {
        next(err)
      } else {
        res.json({ isClean })
      }
    })
  })
}
