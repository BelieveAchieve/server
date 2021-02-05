/**
 * Model that stores information about notifications,
 * such as SMS messages, sent by the app when students
 * request help and new sessions are created.
 */
import { values } from 'lodash'
import { Document, model, Schema, Types } from 'mongoose'
import { Volunteer } from './Volunteer'

export enum NotificationType {
  REGULAR = 'REGULAR',
  FAILSAFE = 'FAILSAFE'
}

export enum NotificationMethod {
  SMS = 'SMS',
  VOICE = 'VOICE',
  EMAIL = 'EMAIL'
}

export interface Notification {
  _id: Types.ObjectId
  volunteer: Types.ObjectId | Volunteer
  sentAt: Date
  type: NotificationType
  method: NotificationMethod
  wasSuccessful: boolean
  messageId: string
  priorityGroup: string
}

export type NotificationDocument = Notification & Document

const notificationSchema = new Schema(
  {
    volunteer: {
      type: Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: values(NotificationType),
      default: NotificationType.REGULAR
    },
    priorityGroup: String,
    method: {
      type: String,
      enum: values(NotificationMethod)
    },
    wasSuccessful: {
      type: Boolean,
      default: false
    },
    // Message ID returned by service, such as Twilio
    messageId: String
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

notificationSchema.virtual('session', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'notifications',
  justOne: true
})

const NotificationModel = model<NotificationDocument>(
  'Notification',
  notificationSchema
)

module.exports = NotificationModel
export default NotificationModel
