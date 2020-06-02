/**
 * Model that keeps track of a user's actions,
 * such as when they start a session, pass a quiz,
 * update their profile, etc.
 */

import { Document, model, Schema, Types } from 'mongoose';
import { USER_ACTION_TYPE, USER_ACTION } from '../constants';
import { User } from './User';
import { Session } from './Session';

export interface UserAction {
  user: User;
  session: Session;
  createdAt: Date;
  actionType: USER_ACTION_TYPE;
  action: USER_ACTION;
  quizCategory: string;
  quizSubcategory: string;
  device: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  ipAddress: string;
}

export type UserActionDocument = UserAction & Document;

const userActionSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: 'User'
  },
  session: {
    type: Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  actionType: {
    type: String,
    enum: [
      USER_ACTION_TYPE.QUIZ,
      USER_ACTION_TYPE.SESSION,
      USER_ACTION_TYPE.ACCOUNT
    ]
  },
  // Specific action
  action: {
    type: String,
    enum: [
      USER_ACTION.QUIZ_STARTED,
      USER_ACTION.QUIZ_PASSED,
      USER_ACTION.QUIZ_FAILED,
      USER_ACTION.QUIZ_VIEWED_MATERIALS,
      USER_ACTION.SESSION_REPLIED_YES,
      USER_ACTION.SESSION_REQUESTED,
      USER_ACTION.SESSION_JOINED,
      USER_ACTION.SESSION_REJOINED,
      USER_ACTION.SESSION_ENDED,
      USER_ACTION.ACCOUNT_UPDATED_AVAILABILITY,
      USER_ACTION.ACCOUNT_UPDATED_PROFILE,
      USER_ACTION.ACCOUNT_CREATED
    ]
  },
  quizCategory: String,
  quizSubcategory: String,
  device: String,
  browser: String,
  browserVersion: String,
  operatingSystem: String,
  operatingSystemVersion: String,
  ipAddress: String
});

const UserActionModel = model<UserActionDocument>(
  'UserAction',
  userActionSchema
);

module.exports = UserActionModel;
export default UserActionModel;
