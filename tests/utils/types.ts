import { Types } from 'mongoose';

// @todo: clean up - use the Student interface from Student.ts when available
export interface Student {
  _id: Types.ObjectId;
  email: string;
  // optional use for building registration form
  firstName?: string;
  lastName?: string;
  firstname: string;
  lastname: string;
  highSchoolId: string;
  password: string;
  zipCode: string;
  studentPartnerOrg: string;
  referredByCode: Types.ObjectId | string;
  referralCode: string;
}

// @todo: clean up - use the Reference interface from Volunteer.ts when available
export interface Reference {
  _id: Types.ObjectId;
  status: string;
  email: string;
  name: string;
  affiliation: string;
  relationshipLength: string;
  patient: number;
  positiveRoleModel: number;
  agreeableAndApproachable: number;
  communicatesEffectively: number;
  trustworthyWithChildren: number;
  rejectionReason: string;
  additionalInfo: string;
}

// @todo: clean up - use the Volunteer interface from Volunteer.ts when available
export interface Volunteer {
  _id: Types.ObjectId;
  email: string;
  // optional use for building registration form
  firstName?: string;
  lastName?: string;
  firstname: string;
  lastname: string;
  password: string;
  zipCode: string;
  college?: string;
  volunteerPartnerOrg?: string;
  favoriteAcademicSubject: string;
  referredByCode: string;
  phone: string;
  referralCode: string;
  references?: Array<Reference>;
  photoIdS3Key?: string;
  photoIdStatus?: string;
  isApproved: boolean;
  // background information
  occupation?: Array<string>;
  company?: string;
  experience?: {
    collegeCounseling: string;
    mentoring: string;
    tutoring: string;
  };
  languages?: Array<string>;
  country?: string;
  state?: string;
  city?: string;
}

export interface StudentRegistrationForm extends Student {
  terms: boolean;
}

export interface VolunteerRegistrationForm extends Volunteer {
  terms: boolean;
}
