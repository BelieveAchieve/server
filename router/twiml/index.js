const express = require('express')
const twilio = require('twilio')

const VoiceResponse = twilio.twiml.VoiceResponse

const config = require('../../config')

// These routes are called by Twilio to receive TwiML instructions for
// voice calls. The Twilio API for voice calling requires that a URL be
// specified to obtain the TwiML code it needs to generate the voice message.
// In order to put our message content into a voice call we give Twilio
// a URL pointing to our own server, which contains the message text encoded
// in it. When the call is answered Twilio sends a request to this
// URL, and our server responds with TwiML containing the decoded message text
// and the configured voice for the text-to-speech conversion.
module.exports = function (app) {
  console.log('TwiML module')

  const router = new express.Router()

  router.post('/message/:message', function (req, res, next) {
    const message = decodeURIComponent(req.params.message)
    console.log('Making TwiML for voice message')

    const twiml = new VoiceResponse()

    twiml.say({ voice: config.voice }, message)

    res.type('text/xml')
    res.send(twiml.toString())
  })

  app.use('/twiml', router)
}
