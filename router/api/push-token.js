const PushToken = require('../../models/PushToken')

module.exports = function(router) {
  router.post('/push-token/save', async function(req, res) {
    const { token } = req.body
    const pushToken = new PushToken({
      user: req.user._id,
      token
    })

    try {
      await pushToken.save()
      res.sendStatus(200)
    } catch (error) {
      res.sendStatus(422)
    }
  })

  router.get('/push-token/check', async function(req, res) {
    const pushToken = await PushToken.findOne({ user: req.user._id })
      .lean()
      .exec()
    if (!pushToken) {
      res.status(404).json({
        err: 'No push token found'
      })
    } else {
      res.sendStatus(200)
    }
  })
}
