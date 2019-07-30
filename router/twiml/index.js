const express = require('express')
const twilio = require('twilio')

const VoiceResponse = twilio.twiml.VoiceResponse

const config = require('../../config')

// Endpoints for generating TwiML instructions
module.exports = function (app) {
  console.log('TwiML module')

  var router = new express.Router()

  router.post('/message/:message', function (req, res, next) {
    var message = decodeURIComponent(req.params.message)
    console.log('Making TwiML for voice message')

    const twiml = new VoiceResponse()

    twiml.say({ voice: config.voice }, message)

    res.type('text/xml')
    res.send(twiml.toString())
  })

  app.use('/twiml', router)
}
