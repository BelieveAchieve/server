var mongoose = require("mongoose");

var Message = require("./Message");

var validTypes = ["Math", "College"];

var sessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    // TODO: validate isVolunteer: false
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    // TODO: validate isVolunteer: true
  },
  type: {
    type: String,
    validate: {
      validator: function(v) {
        var type = v.toLowerCase();
        return validTypes.some(function(validType) {
          return validType.toLowerCase() === type;
        });
      },
      message: "{VALUE} is not a valid type"
    }
  },

  subTopic: {
    type: String,
    default: ""
  },

  messages: [Message.schema],

  whiteboardUrl: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  endedAt: {
    type: Date
  }

  // Scheduled sessions
  // startAt: {
  //   type: Date,
  //   default: Date.now
  // }
});

sessionSchema.methods.saveMessage = function(messageObj, cb) {
  var session = this;
  this.messages = this.messages.concat({
    user: messageObj.user._id,
    contents: messageObj.contents
  });

  var messageId = this.messages[this.messages.length - 1]._id;
  this.save(function(err) {
    var savedMessageIndex = session.messages.findIndex(function(message) {
      return message._id === messageId;
    });

    var savedMessage = session.messages[savedMessageIndex];
    cb(null, savedMessage);
  });
};

sessionSchema.methods.saveWhiteboardUrl = function(whiteboardUrl, cb) {
  var session = this;
  this.whiteboardUrl = whiteboardUrl
  this.save(function(err) {
    if (cb) {
      cb(null, session.whiteboardUrl);
    }
  });
};

//
sessionSchema.methods.joinUser = function(user, cb) {
  if (user.isVolunteer) {
    this.volunteer = user;
  } else {
    this.student = user;
  }
  this.save(cb);
};
sessionSchema.methods.leaveUser = function(user, cb) {
  // below should not save volunteer/user to null, we need to be able to see who the volunteer and student user were
  // should set this.endedAt to Date.now and end the session, both users see the session ended regardless of who ended it
  // student can receive a message telling them they can request help again
  if (user.isVolunteer) {
    this.volunteer = user;
  } else {
    this.student = user;
  }
};

sessionSchema.methods.endSession = function(cb) {
  this.endedAt = new Date();
  this.save(() => console.log(`Ended session ${this._id} at ${this.endedAt}`));
};

sessionSchema.methods.isActive = function(cb) {};

sessionSchema.methods.isWaiting = function(cb) {};

module.exports = mongoose.model("Session", sessionSchema);
