const PushToken = require('../../models/PushToken')
const User = require('../../models/User')

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

  router.post('/push-token/register-attempt', async function(req, res) {
    const user = await User.update(
      { _id: req.user._id },
      { hasSentPushTokenRegister: true }
    )
    if (!user) {
      res.status(404).json({
        err: 'No user found'
      })
    } else {
      res.sendStatus(200)
    }
  })
}
