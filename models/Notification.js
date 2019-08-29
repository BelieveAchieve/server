/**
 * Model that stores information about notifications,
 * such as SMS messages, sent by the app when students
 * request help and new sessions are created.
 */
const mongoose = require('mongoose')

const User = require('./User')

const notificationSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['REGULAR', 'FAILSAFE'],
    default: 'REGULAR'
  },
  method: {
    type: String,
    enum: ['SMS', 'VOICE', 'EMAIL']
  },
  wasSuccessful: {
    type: Boolean,
    default: false
  },
  // Message ID returned by service, such as Twilio
  messageId: String
})

module.exports = mongoose.model('Notification', notificationSchema)