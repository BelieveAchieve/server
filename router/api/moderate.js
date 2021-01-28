const ModerationCtrl = require('../../controllers/ModerationCtrl')

module.exports = router => {
  router.route('/moderate/message').post((req, res, next) => {
    try {
      const isClean = ModerationCtrl.moderateMessage(req.body)
      res.json({ isClean })
    } catch (error) {
      next(error)
    }
  })
}
