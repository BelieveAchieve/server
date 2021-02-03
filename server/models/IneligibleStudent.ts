import { Document, model, Schema, Types } from 'mongoose';
import { School } from './School';
import { User } from './User';

export interface IneligibleStudent {
  _id: Types.ObjectId;
  createdAt: Date;
  email: string;
  zipCode: string;
  school: Types.ObjectId | School;
  ipAddress: string;
  referredBy: Types.ObjectId | User;
}

export type IneligibleStudentDocument = IneligibleStudent & Document;

const ineligibleStudentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  email: String,
  zipCode: String,
  school: {
    type: Types.ObjectId,
    ref: 'School'
  },
  ipAddress: String,
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const IneligibleStudentModel = model<IneligibleStudentDocument>(
  'IneligibleStudent',
  ineligibleStudentSchema
);

module.exports = IneligibleStudentModel;
export default IneligibleStudentModel;
