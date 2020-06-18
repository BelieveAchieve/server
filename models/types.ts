import { Document } from 'mongoose';

export interface User extends Document {
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
}

export interface Reference extends Document {
  name: String;
  email: String;
  status: String;
}

export interface Volunteer extends User {
  references: [Reference];
}
