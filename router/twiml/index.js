const express = require('express')
const twilio = require('twilio')

const VoiceResponse = twilio.twiml.VoiceResponse
const MessagingResponse = require('twilio').twiml.MessagingResponse

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

  router.post('/incoming-sms', function (req, res, next) {
    const twiml = new MessagingResponse()

    console.log(req.body)

    const incomingMessage = req.body.Body

    if (incomingMessage === 'YES') {
      /**
       * Find session that this user was notified about and reply with its link
       * Or if they weren't notified recently (~1 hr), say so
       * If someone already joined the session, say so
       * If the student cancelled the session, say so
       */
      twiml.message('TODO: send session link')
    } else if (incomingMessage === 'HELP') {
      twiml.message('TODO: explain msg options (i.e. YES/HELP/STOP)')
    } else {
      twiml.message('as a robot, i dont understand. plz email contact@upchieve.org')
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' })
    res.end(twiml.toString())
  })

  app.use('/twiml', router)
}
