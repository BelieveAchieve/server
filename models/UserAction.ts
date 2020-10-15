/**
 * Model that keeps track of a user's actions,
 * such as when they start a session, pass a quiz,
 * update their profile, etc.
 */
import { values } from 'lodash';
import { Document, model, Schema, Types } from 'mongoose';
import { USER_ACTION_TYPE, USER_ACTION } from '../constants';
import { User } from './User';
import { Session } from './Session';

export interface UserAction {
  _id: Types.ObjectId;
  user: Types.ObjectId | User;
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
  referenceEmail: string;
  banReason: string;
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
    enum: values(USER_ACTION_TYPE)
  },
  // Specific action
  action: {
    type: String,
    enum: values(USER_ACTION)
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
