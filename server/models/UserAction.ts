/**
 * Model that keeps track of a user's actions,
 * such as when they start a session, pass a quiz,
 * update their profile, etc.
 */

import { Schema, Types, Document, model } from 'mongoose';
import { USER_ACTION } from '../constants';

export interface UserAction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  session: Types.ObjectId;
  createdAt: Date;
  actionType: string;
  action: string;
  quizCategory: string;
  quizSubcategory: string;
  device: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  ipAddress: string;
  referenceEmail: string;
  banReason: string;
}

export type UserActionDocument = UserAction & Document;

const userActionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  actionType: {
    type: String,
    enum: [
      USER_ACTION.TYPE.QUIZ,
      USER_ACTION.TYPE.SESSION,
      USER_ACTION.TYPE.ACCOUNT,
      USER_ACTION.TYPE.ADMIN
    ]
  },
  // Specific action
  action: {
    type: String,
    enum: [
      USER_ACTION.QUIZ.STARTED,
      USER_ACTION.QUIZ.PASSED,
      USER_ACTION.QUIZ.FAILED,
      USER_ACTION.QUIZ.VIEWED_MATERIALS,
      USER_ACTION.QUIZ.UNLOCKED_SUBJECT,
      USER_ACTION.SESSION.REPLIED_YES,
      USER_ACTION.SESSION.REQUESTED,
      USER_ACTION.SESSION.JOINED,
      USER_ACTION.SESSION.REJOINED,
      USER_ACTION.SESSION.ENDED,
      USER_ACTION.SESSION.TIMED_OUT_15_MINS,
      USER_ACTION.SESSION.TIMED_OUT_45_MINS,
      USER_ACTION.ACCOUNT.UPDATED_AVAILABILITY,
      USER_ACTION.ACCOUNT.UPDATED_PROFILE,
      USER_ACTION.ACCOUNT.CREATED,
      USER_ACTION.ACCOUNT.APPROVED,
      USER_ACTION.ACCOUNT.ONBOARDED,
      USER_ACTION.ACCOUNT.ADDED_REFERENCE,
      USER_ACTION.ACCOUNT.ADDED_PHOTO_ID,
      USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO,
      USER_ACTION.ACCOUNT.DELETED_REFERENCE,
      USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM,
      USER_ACTION.ACCOUNT.REJECTED_PHOTO_ID,
      USER_ACTION.ACCOUNT.REJECTED_REFERENCE,
      USER_ACTION.ACCOUNT.BANNED,
      USER_ACTION.ACCOUNT.DEACTIVATED
    ]
  },
  quizCategory: String,
  quizSubcategory: String,
  device: String,
  browser: String,
  browserVersion: String,
  operatingSystem: String,
  operatingSystemVersion: String,
  ipAddress: String,
  referenceEmail: String,
  banReason: String
});

const UserActionModel = model<UserActionDocument>(
  'UserAction',
  userActionSchema
);

module.exports = UserActionModel;
export default UserActionModel;
