const admin = require('firebase-admin')

module.exports = function(app) {
  admin.initializeApp({
    projectId: 877923781231, // TODO: move to config
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_PRIVATE_KEY_JSON)
    )
  })

  app.use('/setcookie', function(req, res, next) {
    res.cookie('mobile_cookie', '1', { maxAge: 3600 * 24 * 365 * 10 })
    res.redirect(302, 'http://localhost:12380?redirected')
  })
}
