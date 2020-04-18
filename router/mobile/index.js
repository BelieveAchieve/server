const admin = require('firebase-admin')
const config = require('../../config')

module.exports = function(app) {
  // @todo: need to set FIREBASE_PRIVATE_KEY_JSON in local development to run
  if (process.env.FIREBASE_PRIVATE_KEY_JSON) {
    admin.initializeApp({
      projectId: config.firebase.projectId,
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_PRIVATE_KEY_JSON)
      )
    })
  }

  // used in native app to workaround iOS 3rd party cookie limitation
  app.use('/setcookie', function(req, res, next) {
    res.cookie('mobile_cookie', '1', { maxAge: 3600 * 24 * 365 * 10 })
    res.redirect(302, 'http://localhost:12380?redirected')
  })
}
