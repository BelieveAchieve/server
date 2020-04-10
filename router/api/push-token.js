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
}
