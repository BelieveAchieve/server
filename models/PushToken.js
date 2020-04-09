/**
 * Model that stores push token information
 * to send to users for push notifications
 *
 */
const mongoose = require('mongoose')

const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now },
    // Token ID returned from push token register
    token: String
  },
  {
    toJSON: {
      virtuals: true
    },

    toObject: {
      virtuals: true
    }
  }
)

module.exports = mongoose.model('PushToken', pushTokenSchema)
