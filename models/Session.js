var mongoose = require('mongoose')

var Message = require('./Message')

var validTypes = ['Math', 'College']

var sessionSchema = new mongoose.Schema({
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
      validator: function (v) {
        var type = v.toLowerCase()
        return validTypes.some(function (validType) {
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

  whiteboardUrl: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  volunteerJoinedAt: {
    type: Date
  },

  failedJoins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  endedAt: {
    type: Date
  },

  endedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }]
})

sessionSchema.methods.saveMessage = function (messageObj, cb) {
  var session = this
  this.messages = this.messages.concat({
    user: messageObj.user._id,
    contents: messageObj.contents
  })

  var messageId = this.messages[this.messages.length - 1]._id
  const promise = this.save()
    .then(() => {
      var savedMessageIndex = session.messages.findIndex(function (message) {
        return message._id === messageId
      })

      var savedMessage = session.messages[savedMessageIndex]

      return savedMessage
    })

  if (cb) {
    promise.then(cb)
  } else {
    return promise
  }
}

sessionSchema.methods.saveWhiteboardUrl = function (whiteboardUrl, cb) {
  var session = this
  this.whiteboardUrl = whiteboardUrl
  this.save(function (err) {
    if (cb) {
      cb(null, session.whiteboardUrl)
    }
  })
}

// helper function for handling joins that fail because session is fulfilled or has ended
function failJoin (session, user, error) {
  session.failedJoins.push(user._id)
  session.save()
  throw error
}

// this method should callback with an error on attempts to join by non-participants
// so that SessionCtrl knows to disconnect the socket
sessionSchema.methods.joinUser = async function (user) {
  if (this.endedAt) {
    failJoin(this, user, new Error('Session has ended'))
  }

  if (user.isVolunteer) {
    if (this.volunteer) {
      if (!this.volunteer._id.equals(user._id)) {
        failJoin(this, user, new Error('A volunteer has already joined this session.'))
      }
    } else {
      this.volunteer = user
    }

    if (!this.volunteerJoinedAt) {
      this.volunteerJoinedAt = new Date()
    }
  } else if (this.student) {
    if (!this.student._id.equals(user._id)) {
      failJoin(this, user, new Error('A student has already joined this session.'))
    }
  } else {
    this.student = user
  }

  return this.save()
}

sessionSchema.methods.leaveUser = function (user, cb) {
  // below should not save volunteer/user to null, we need to be able to see who the volunteer and student user were
  // should set this.endedAt to Date.now and end the session, both users see the session ended regardless of who ended it
  // student can receive a message telling them they can request help again
  if (user.isVolunteer) {
    this.volunteer = user
  } else {
    this.student = user
  }
}

sessionSchema.methods.endSession = function (userWhoEnded) {
  this.endedAt = new Date()
  this.endedBy = userWhoEnded
  return this.save().then(() => console.log(`Ended session ${this._id} at ${this.endedAt}`))
}

sessionSchema.methods.addNotifications = function (notificationsToAdd, cb) {
  return this.model('Session')
    .findByIdAndUpdate(this._id, {
      $push: { notifications: { $each: notificationsToAdd } }
    })
    .exec(cb)
}

sessionSchema.methods.isActive = function (cb) {}

sessionSchema.methods.isWaiting = function (cb) {}

sessionSchema.statics.findLatest = function (attrs, cb) {
  return this.find(attrs)
    .sort({ createdAt: -1 })
    .limit(1)
    .findOne()
    .populate({ path: 'volunteer', select: 'firstname isVolunteer' })
    .populate({ path: 'student', select: 'firstname isVolunteer' })
    .exec(cb)
}

// user's current session
sessionSchema.statics.current = function (userId, cb) {
  return this.findLatest(
    {
      $and: [
        { endedAt: { $exists: false } },
        {
          $or: [{ student: userId }, { volunteer: userId }]
        }
      ]
    })
}

// sessions that have not yet been fulfilled by a volunteer
sessionSchema.statics.getUnfulfilledSessions = function (cb) {
  const queryAttrs = {
    volunteerJoinedAt: { $exists: false },
    endedAt: { $exists: false }
  }

  return this.find(queryAttrs)
    .populate({ path: 'student', select: 'firstname isVolunteer' })
    .sort({ createdAt: -1 })
    .exec(cb)
}

module.exports = mongoose.model('Session', sessionSchema)
