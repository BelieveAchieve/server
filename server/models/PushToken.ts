/**
 * Model that stores push token information
 * to send to users for push notifications
 *
 */
import { Document, model, Schema, Types } from 'mongoose'
import { User } from './User'

export interface PushToken {
  user: Types.ObjectId | User
  createdAt: Date
  token: string
}

export type PushTokenDocument = PushToken & Document

const pushTokenSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now },
    // Token ID returned from push token register
    token: { type: String, unique: true }
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

const PushTokenModel = model<PushTokenDocument>('PushToken', pushTokenSchema)

module.exports = PushTokenModel
export default PushTokenModel
