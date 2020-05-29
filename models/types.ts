import { Document } from 'mongoose';

export interface User extends Document {
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
}
