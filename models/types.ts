import { Document } from 'mongoose';

export interface User extends Document {
  calculateElapsedAvailability: (Date) => number;
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
  createdAt: Date;
  firstname: string;
  email: string;
  pastSessions: Array<string>;
}
