const mongoose = require('mongoose')

const Message = require('./Message')
const moment = require('moment-timezone')
const { SESSION_FLAGS } = require('../constants')
const { values } = require('lodash')

const validTypes = ['Math', 'College', 'Science']

const sessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: false
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: true
  },
  type: {
    type: String,
    validate: {
      validator: function(v) {
        const type = v.toLowerCase()
        return validTypes.some(function(validType) {
          return validType.toLowerCase() === type
        })
      },
      message: '{VALUE} is not a valid type'
    }
  },

  subTopic: {
    type: String,
    default: ''
  },

  messages: [Message.schema],

  whiteboardDoc: {
    type: String,
    default: '',
    select: false
  },

  quillDoc: {
    type: String,
    default: '',
    select: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  volunteerJoinedAt: {
    type: Date
  },

  failedJoins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  endedAt: {
    type: Date
  },

  endedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  ],

  photos: [String],
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  reportMessage: String,
  flags: {
    type: [String],
    enum: values(SESSION_FLAGS)
  },
  reviewedStudent: Boolean,
  reviewedVolunteer: Boolean
})

sessionSchema.methods.addNotifications = function(notificationsToAdd, cb) {
  return this.model('Session')
    .findByIdAndUpdate(this._id, {
      $push: { notifications: { $each: notificationsToAdd } }
    })
    .exec(cb)
}

sessionSchema.statics.findLatest = function(attrs, cb) {
  // @todo: refactor this query
  return this.find(attrs)
    .sort({ createdAt: -1 })
    .limit(1)
    .findOne()
    .populate({ path: 'volunteer', select: 'firstname isVolunteer' })
    .populate({ path: 'student', select: 'firstname isVolunteer' })
    .exec(cb)
}

// user's current session
sessionSchema.statics.current = function(userId, cb) {
  return this.findLatest({
    endedAt: { $exists: false },
    $or: [{ student: userId }, { volunteer: userId }]
  })
}

// sessions that have not yet been fulfilled by a volunteer
sessionSchema.statics.getUnfulfilledSessions = async function() {
  // @note: this query is sorted in memory and uses the volunteer: 1, endedAt: 1 index
  const queryAttrs = {
    volunteer: { $exists: false },
    endedAt: { $exists: false },
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }

  const sessions = await this.find(queryAttrs)
    .populate({
      path: 'student',
      select: 'firstname isVolunteer isTestUser isBanned pastSessions'
    })
    .sort({ createdAt: -1 })
    .exec()

  const oneMinuteAgo = moment().subtract(1, 'minutes')

  return sessions.filter(session => {
    const isNewStudent =
      session.student.pastSessions && session.student.pastSessions.length === 0
    const wasSessionCreatedAMinuteAgo = moment(oneMinuteAgo).isBefore(
      session.createdAt
    )
    // Don't show new students' sessions for a minute (they often cancel immediately)
    if (isNewStudent && wasSessionCreatedAMinuteAgo) return false
    // Don't show banned students' sessions
    if (session.student.isBanned) return false
    return true
  })
}

module.exports = mongoose.model('Session', sessionSchema)
