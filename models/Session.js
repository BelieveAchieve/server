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
  this.save(function (err) {
    var savedMessageIndex = session.messages.findIndex(function (message) {
      return message._id === messageId
    })

    var savedMessage = session.messages[savedMessageIndex]
    cb(null, savedMessage)
  })
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

// this method should callback with an error on attempts to join by non-participants
// so that SessionCtrl knows to disconnect the socket
sessionSchema.methods.joinUser = function (user, cb) {
  if (user.isVolunteer) {
    if (this.volunteer) {
      if (!this.volunteer._id.equals(user._id)) {
        cb(new Error('A volunteer has already joined this session.'))
        return
      }
    } else {
      this.volunteer = user
    }

    if (!this.volunteerJoinedAt) {
      this.volunteerJoinedAt = new Date()
    }
  } else if (this.student) {
    if (!this.student._id.equals(user._id)) {
      cb(new Error(`A student ${this.student._id} has already joined this session.`))
      return
    }
  } else {
    this.student = user
  }

  this.save(cb)
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
  this.save(() => console.log(`Ended session ${this._id} at ${this.endedAt}`))
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

module.exports = mongoose.model('Session', sessionSchema)
