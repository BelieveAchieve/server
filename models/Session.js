const mongoose = require('mongoose')

const Message = require('./Message')
const moment = require('moment-timezone')

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

  reportMessage: String
})

sessionSchema.methods.saveMessage = function(messageObj, cb) {
  const session = this
  this.messages = this.messages.concat({
    user: messageObj.user._id,
    contents: messageObj.contents
  })

  const messageId = this.messages[this.messages.length - 1]._id
  const promise = this.save().then(() => {
    const savedMessageIndex = session.messages.findIndex(function(message) {
      return message._id === messageId
    })

    const savedMessage = session.messages[savedMessageIndex]

    return savedMessage
  })

  if (cb) {
    promise.then(cb)
  } else {
    return promise
  }
}

// helper function for handling joins that fail because session is fulfilled or has ended
function failJoin(session, user, error) {
  if (user.isVolunteer) {
    session.failedJoins.push(user._id)
    session.save()
  }
  throw error
}

// this method should callback with an error on attempts to join by non-participants
// so that SessionCtrl knows to disconnect the socket
sessionSchema.methods.joinUser = function(user) {
  if (this.endedAt) {
    failJoin(this, user, new Error('Session has ended'))
  }

  if (user.isVolunteer) {
    if (this.volunteer) {
      if (!this.volunteer._id.equals(user._id)) {
        failJoin(
          this,
          user,
          new Error('A volunteer has already joined this session.')
        )
      }
    } else {
      this.volunteer = user
    }

    if (!this.volunteerJoinedAt) {
      this.volunteerJoinedAt = new Date()
    }
  } else if (this.student) {
    if (!this.student._id.equals(user._id)) {
      failJoin(
        this,
        user,
        new Error('A student has already joined this session.')
      )
    }
  } else {
    this.student = user
  }

  return this.save()
}

sessionSchema.methods.addNotifications = function(notificationsToAdd, cb) {
  return this.model('Session')
    .findByIdAndUpdate(this._id, {
      $push: { notifications: { $each: notificationsToAdd } }
    })
    .exec(cb)
}

sessionSchema.statics.findLatest = function(attrs, cb) {
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
    $and: [
      { endedAt: { $exists: false } },
      {
        $or: [{ student: userId }, { volunteer: userId }]
      }
    ]
  })
}

// sessions that have not yet been fulfilled by a volunteer
sessionSchema.statics.getUnfulfilledSessions = async function() {
  const queryAttrs = {
    volunteerJoinedAt: { $exists: false },
    endedAt: { $exists: false }
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
