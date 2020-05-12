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

// Given a user record, strip out sensitive data for public consumption
studentSchema.methods.parseProfile = function() {
  return {
    _id: this._id,
    email: this.email,
    verified: this.verified,
    firstname: this.firstname,
    lastname: this.lastname,
    isVolunteer: this.isVolunteer,
    isAdmin: this.isAdmin,
    isTestUser: this.isTestUser,
    createdAt: this.createdAt,
    isFakeUser: this.isFakeUser
  };
};

// Placeholder method to support asynchronous profile parsing
studentSchema.methods.getProfile = function(cb) {
  cb(null, this.parseProfile());
};

// Use the user schema as the base schema for Student
const Student = User.discriminator('Student', studentSchema);

export default Student;
