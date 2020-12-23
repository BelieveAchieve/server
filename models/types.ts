import { Document, Types } from 'mongoose';

export interface User extends Document {
  _id: Types.ObjectId;
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
  timezone;
}

export interface Reference extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

// @todo: find a way to reconcile availabilityDaySchema with typescript formats, which cannot start with numbers

export interface Availability {
  Sunday?;
  Monday?;
  Tuesday?;
  Wednesday?;
  Thursday?;
  Friday?;
  Saturday?;
}

export interface IVolunteer extends User {
  references: [Reference];
  availability: Availability;
  isOnboarded: boolean;
  subjects: string[];
}
