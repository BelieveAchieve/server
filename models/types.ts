import { Document, Types } from 'mongoose';

export interface User extends Document {
  _id: Types.ObjectId;
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
}

export interface Reference extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface Volunteer extends User {
  references: [Reference];
  isApproved: boolean;
  isOnboarded: boolean;
}

export type Student = User;
