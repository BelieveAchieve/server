import { Document } from 'mongoose';

export interface User extends Document {
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
}

export interface Reference extends Document {
  name: string;
  email: string;
  status: string;
}

export interface Volunteer extends User {
  references: [Reference];
}
