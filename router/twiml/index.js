const express = require('express')
const twilio = require('twilio')
const _ = require('lodash')

const VoiceResponse = twilio.twiml.VoiceResponse
const MessagingResponse = require('twilio').twiml.MessagingResponse

const config = require('../../config')
const twilioService = require('../../services/twilio')
const User = require('../../models/User')

module.exports = function (app) {
  console.log('TwiML module')

  const router = new express.Router()

  // This route is called by Twilio to receive TwiML instructions for
  // voice calls. The Twilio API for voice calling requires that a URL be
  // specified to obtain the TwiML code it needs to generate the voice message.
  // In order to put our message content into a voice call we give Twilio
  // a URL pointing to our own server, which contains the message text encoded
  // in it. When the call is answered, Twilio sends a request to this
  // URL, and our server responds with TwiML containing the decoded message text
  // and the configured voice for the text-to-speech conversion.
  router.post('/message/:message', function (req, res, next) {
    const message = decodeURIComponent(req.params.message)
    console.log('Making TwiML for voice message')

    const twiml = new VoiceResponse()

    twiml.say({ voice: config.voice }, message)

    res.type('text/xml')
    res.send(twiml.toString())
  })

  /**
   * This route handles SMS messages sent to our Twilio numbers
   */
  router.post('/incoming-sms', async function (req, res, next) {
    const twiml = new MessagingResponse()

    const incomingMessage = req.body.Body
    const incomingPhoneNumber = req.body.From

    if (!incomingPhoneNumber) return res.status(422).json({ err: 'Error: Missing phone number' })

    /**
     * If a volunteer responds "Yes" to a text notification, send
     * them a link to the session that they were notified about.
     */
    const yesRegex = /\b(yes|yeah|yea|yess|yesss|ye|ya|yaa|yee|y|yeh|yah|sure)\b/gmi
    const isYesMessage = !!incomingMessage.match(yesRegex)

    if (isYesMessage) {
      try {
        /**
         * 1. Find the user by their phone number
         * 2. Populate their most recent notification
         * 3. Populate that notification's session
         */
        const populatedUser = await User.findOne({ phone: incomingPhoneNumber })
          .populate({
            path: 'volunteerLastNotification',
            populate: {
              path: 'session',
              select: '_id volunteerJoinedAt endedAt'
            }
          })

        // Get the session if it exists, or else an empty object
        const session = _.get(populatedUser, 'volunteerLastNotification.session', {})

        if (!session._id) {
          // Handle: No session found
          twiml.message('Error: No session found. You can try joining the session from the dashboard at app.upchieve.org')
        } else if (session.volunteerJoinedAt) {
          // Handle: Different volunteer already joined
          twiml.message('A volunteer has already joined this session')
        } else if (session.endedAt) {
          // Handle: Student already ended the session
          twiml.message('The student has cancelled their help request')
        } else {
          // Handle: No issues, so send the session URL
          const sessionUrl = twilioService.getSessionUrl(session._id)
          twiml.message(sessionUrl)
        }
      } catch (err) {
        return res.json({ err: err.toString() })
      }
    } else {
      // Handle: Unknown message intent
      twiml.message('Hmm, I don\'t understand. Please send questions to contact@upchieve.org')
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' })
    res.end(twiml.toString())
  })

  app.use('/twiml', router)
}
