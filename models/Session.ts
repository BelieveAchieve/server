import moment from 'moment-timezone';
import { Document, model, Schema, Types } from 'mongoose';
import { isObjectId } from '../utils/typing';
import MessageModel, { Message, MessageDocument } from './Message';
import { Notification } from './Notification';
import { User } from './User';
import { Student } from './Student';
import { Volunteer } from './Volunteer';

export interface Session {
  _id: Types.ObjectId;
  student: Types.ObjectId | Student;
  volunteer: Types.ObjectId | Volunteer;
  type: string;
  subTopic: string;
  messages: Message[];
  whiteboardDoc: string;
  quillDoc: string;
  createdAt: Date;
  volunteerJoinedAt: Date;
  failedJoins: (Types.ObjectId | User)[];
  endedAt: Date;
  endedBy: Types.ObjectId | User;
  notifications: (Types.ObjectId | Notification)[];
  photos: string[];
  isReported: boolean;
  reportReason: string;
  reportMessage: string;
}

export type SessionDocument = Session & Document;

const validTypes = ['Math', 'College', 'Science'];

const sessionSchema = new Schema({
  student: {
    type: Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: false
  },
  volunteer: {
    type: Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: true
  },
  type: {
    type: String,
    validate: {
      validator: function(v: string): boolean {
        const type = v.toLowerCase();
        return validTypes.some(function(validType) {
          return validType.toLowerCase() === type;
        });
      },
      message: '{VALUE} is not a valid type'
    }
  },

  subTopic: {
    type: String,
    default: ''
  },

  messages: [MessageModel.schema],

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
      type: Types.ObjectId,
      ref: 'User'
    }
  ],

  endedAt: {
    type: Date
  },

  endedBy: {
    type: Types.ObjectId,
    ref: 'User'
  },

  notifications: [
    {
      type: Types.ObjectId,
      ref: 'Notification'
    }
  ],
  photos: [String],

  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  reportMessage: String
});

sessionSchema.methods.saveMessage = function(
  messageObj: Partial<Message>,
  cb: (message: Message) => void
): Promise<MessageDocument> {
  const session: Session = this; // eslint-disable-line @typescript-eslint/no-this-alias
  this.messages = this.messages.concat({
    user: isObjectId(messageObj.user) ? messageObj.user : messageObj.user._id,
    contents: messageObj.contents
  });

  const messageId = this.messages[this.messages.length - 1]._id;
  const promise = this.save().then(() => {
    const savedMessageIndex = session.messages.findIndex(function(message) {
      return message._id === messageId;
    });

    const savedMessage = session.messages[savedMessageIndex];

    return savedMessage;
  });

  if (cb) promise.then(cb);
  return promise;
};

// helper function for handling joins that fail because session is fulfilled or has ended
const failJoin = (session: SessionDocument, user: User, error: Error): void => {
  if (user.isVolunteer) {
    session.failedJoins.push(user._id);
    session.save();
  }
  throw error;
};

// this method should callback with an error on attempts to join by non-participants
// so that SessionCtrl knows to disconnect the socket
sessionSchema.methods.joinUser = function(
  user: User
): Promise<SessionDocument> {
  if (this.endedAt) {
    failJoin(this, user, new Error('Session has ended'));
  }

  if (user.isVolunteer) {
    if (this.volunteer) {
      if (!this.volunteer._id.equals(user._id)) {
        failJoin(
          this,
          user,
          new Error('A volunteer has already joined this session.')
        );
      }
    } else {
      this.volunteer = user;
    }

    if (!this.volunteerJoinedAt) {
      this.volunteerJoinedAt = new Date();
    }
  } else if (this.student) {
    if (!this.student._id.equals(user._id)) {
      failJoin(
        this,
        user,
        new Error('A student has already joined this session.')
      );
    }
  } else {
    this.student = user;
  }

  return this.save();
};

sessionSchema.methods.endSession = function(userWhoEnded: User): Promise<void> {
  this.endedAt = new Date();
  this.endedBy = userWhoEnded;
  return this.save().then(() =>
    console.log(`Ended session ${this._id} at ${this.endedAt}`)
  );
};

sessionSchema.methods.addNotifications = function(
  notificationsToAdd: Message[],
  cb: (session: SessionDocument) => void
): Promise<SessionDocument> {
  return this.model('Session')
    .findByIdAndUpdate(this._id, {
      $push: { notifications: { $each: notificationsToAdd } }
    })
    .exec(cb);
};

sessionSchema.statics.findLatest = function(
  attrs: Partial<Session>,
  cb: (session: SessionDocument) => void
): Promise<SessionDocument> {
  // @todo: refactor this query
  return this.find(attrs)
    .sort({ createdAt: -1 })
    .limit(1)
    .findOne()
    .populate({ path: 'volunteer', select: 'firstname isVolunteer' })
    .populate({ path: 'student', select: 'firstname isVolunteer' })
    .exec(cb);
};

// user's current session
sessionSchema.statics.current = function(
  userId: Types.ObjectId
): Promise<SessionDocument> {
  return this.findLatest({
    endedAt: { $exists: false },
    $or: [{ student: userId }, { volunteer: userId }]
  });
};

// sessions that have not yet been fulfilled by a volunteer
sessionSchema.statics.getUnfulfilledSessions = async function(): Promise<
  SessionDocument[]
> {
  // @note: this query is sorted in memory and uses the volunteer: 1, endedAt: 1 index
  const queryAttrs = {
    volunteer: { $exists: false },
    endedAt: { $exists: false },
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  };

  const sessions = await this.find(queryAttrs)
    .populate({
      path: 'student',
      select: 'firstname isVolunteer isTestUser isBanned pastSessions'
    })
    .sort({ createdAt: -1 })
    .exec();

  const oneMinuteAgo = moment().subtract(1, 'minutes');

  return sessions.filter(session => {
    const isNewStudent =
      session.student.pastSessions && session.student.pastSessions.length === 0;
    const wasSessionCreatedAMinuteAgo = moment(oneMinuteAgo).isBefore(
      session.createdAt
    );
    // Don't show new students' sessions for a minute (they often cancel immediately)
    if (isNewStudent && wasSessionCreatedAMinuteAgo) return false;
    // Don't show banned students' sessions
    if (session.student.isBanned) return false;
    return true;
  });
};

const SessionModel = model<SessionDocument>('Session', sessionSchema);

module.exports = SessionModel;
export default SessionModel;
