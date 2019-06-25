var ContactCtrl = require('../../controllers/ContactCtrl')
var VerificationCtrl = require('../../controllers/VerificationCtrl')
module.exports = function (router) {
  router.post('/verify/send', function (req, res) {
    var body = req.body
    ContactCtrl.initiateContactForm(
      {
        responseData: body['responseData']
      },
      function (err, email) {
        if (err) {
          res.json({ err: err })
        } else {
          res.json({ msg: 'Contact us form email sent to ' + email })
        }
      }
    )
  })
}
