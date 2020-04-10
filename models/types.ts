import { Document } from 'mongoose';

export interface IUser extends Document {
  calculateElapsedAvailability: (Date) => number;
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
}
