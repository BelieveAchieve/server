import moment from 'moment-timezone';
import { values } from 'lodash';
import { Document, model, Model, Schema, Types } from 'mongoose';
import { SESSION_FLAGS } from '../constants';
import MessageModel, { Message } from './Message';
import { Notification, NotificationDocument } from './Notification';
import { User } from './User';
import { Student } from './Student';
import { Volunteer } from './Volunteer';

const validTypes = ['Math', 'College', 'Science', 'SAT'];

export interface Session {
  _id: Types.ObjectId;
  student: Types.ObjectId | Student;
  volunteer: Types.ObjectId | Volunteer;
  type: string;
  subTopic: string;
  messages: Message[];
  hasWhiteboardDoc: boolean;
  // @todo: make optional once whiteboard docs are in azure storage
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
  flags: string[];
  reviewedStudent: boolean;
  reviewedVolunteer: boolean;
  timeTutored: number;
}

export type SessionDocument = Session & Document;

const sessionSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: false
  },
  volunteer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
    // TODO: validate isVolunteer: true
  },
  type: {
    type: String,
    validate: {
      validator: function(v): boolean {
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

  hasWhiteboardDoc: {
    type: Boolean
  },

  // @todo: remove once whiteboard docs are in azure storage
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
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  endedAt: {
    type: Date
  },

  endedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  notifications: [
    {
      type: Schema.Types.ObjectId,
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
  reviewedVolunteer: Boolean,
  timeTutored: { type: Number, default: 0 }
});

sessionSchema.methods.addNotifications = function(
  notificationsToAdd: NotificationDocument[]
): Promise<SessionDocument> {
  return this.model('Session')
    .findByIdAndUpdate(this._id, {
      $push: { notifications: { $each: notificationsToAdd } }
    })
    .exec();
};

sessionSchema.statics.findLatest = function(
  attrs: Partial<Session>
): Promise<SessionDocument> {
  // @todo: refactor this query
  return this.find(attrs)
    .sort({ createdAt: -1 })
    .limit(1)
    .findOne()
    .populate({ path: 'volunteer', select: 'firstname isVolunteer' })
    .populate({ path: 'student', select: 'firstname isVolunteer' })
    .exec();
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

export interface SessionModelType extends Model<SessionDocument> {
  addNotifications(): Promise<NotificationDocument[]>;
  findLatest(): Promise<SessionDocument>;
  current(): Promise<SessionDocument>;
  getUnfulfilledSessions(): Promise<SessionDocument[]>;
}

const SessionModel = model<SessionDocument, SessionModelType>(
  'Session',
  sessionSchema
);

module.exports = SessionModel;
export default SessionModel;
