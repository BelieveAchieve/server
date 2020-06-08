import mongoose from 'mongoose';
import User from './User';

const schemaOptions = {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
};

const studentSchema = new mongoose.Schema(
  {
    approvedHighschool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
      /* TODO validate approvedHighschool.isApproved: true
       * if this.isVolunteer is false */
    },
    zipCode: String,
    studentPartnerOrg: String
  },
  schemaOptions
);

// Use the user schema as the base schema for Student
const Student = User.discriminator('Student', studentSchema);

module.exports = Student;
export default Student;
