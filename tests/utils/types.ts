import { Types } from 'mongoose';
import { SUBJECTS, REQUIRED_TRAINING } from '../../constants';

export interface User {
  _id: Types.ObjectId;
  email: string;
  // optional use for building registration form
  firstName?: string;
  lastName?: string;
  firstname: string;
  lastname: string;
  password: string;
  referredByCode: Types.ObjectId | string;
  referralCode: string;
}

// @todo: clean up - use the Student interface from Student.ts when available
export interface Student extends User {
  highSchoolId: string;
  zipCode: string;
  studentPartnerOrg: string;
}

// @todo: clean up - use the Reference interface from Volunteer.ts when available
export interface Reference {
  _id: Types.ObjectId;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
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
export interface Volunteer extends User {
  zipCode: string;
  college: string;
  volunteerPartnerOrg?: string;
  favoriteAcademicSubject: string;
  phone: string;
  references?: Array<Reference>;
  photoIdS3Key?: string;
  photoIdStatus?: string;
  isApproved: boolean;
  isOnboarded: boolean;
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
  certifications: Certifications;
  availability: Availability;
}

export interface StudentRegistrationForm extends Student {
  terms: boolean;
}

export interface VolunteerRegistrationForm extends Volunteer {
  terms: boolean;
}

export enum DAYS {
  SUNDAY = 'Sunday',
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday'
}

export enum HOURS {
  '12AM' = '12a',
  '1AM' = '1a',
  '2AM' = '2a',
  '3AM' = '3a',
  '4AM' = '4a',
  '5AM' = '5a',
  '6AM' = '6a',
  '7AM' = '7a',
  '8AM' = '8a',
  '9AM' = '9a',
  '10AM' = '10a',
  '11AM' = '11a',
  '12PM' = '12p',
  '1PM' = '1p',
  '2PM' = '2p',
  '3PM' = '3p',
  '4PM' = '4p',
  '5PM' = '5p',
  '6PM' = '6p',
  '7PM' = '7p',
  '8PM' = '8p',
  '9PM' = '9p',
  '10PM' = '10p',
  '11PM' = '11p'
}

export interface CertificationInfo {
  passed: boolean;
  tries: number;
  lastAttemptedAt?: Date;
}

export interface Certifications {
  [SUBJECTS.PREALGREBA]: CertificationInfo;
  [SUBJECTS.ALGEBRA]: CertificationInfo;
  [SUBJECTS.GEOMETRY]: CertificationInfo;
  [SUBJECTS.TRIGONOMETRY]: CertificationInfo;
  [SUBJECTS.PRECALCULUS]: CertificationInfo;
  [SUBJECTS.CALCULUS_AB]: CertificationInfo;
  [SUBJECTS.CALCULUS_BC]: CertificationInfo;
  [SUBJECTS.STATISTICS]: CertificationInfo;
  [SUBJECTS.BIOLOGY]: CertificationInfo;
  [SUBJECTS.CHEMISTRY]: CertificationInfo;
  [SUBJECTS.PHYSICS_ONE]: CertificationInfo;
  [SUBJECTS.PHYSICS_TWO]: CertificationInfo;
  [SUBJECTS.ENVIRONMENTAL_SCIENCE]: CertificationInfo;
  [SUBJECTS.PLANNING]: CertificationInfo;
  [SUBJECTS.APPLICATIONS]: CertificationInfo;
  [SUBJECTS.ESSAYS]: CertificationInfo;
  [SUBJECTS.FINANCIAL_AID]: CertificationInfo;
  [SUBJECTS.SPORTS_RECRUIMENT_PLANNING]: CertificationInfo;
  [SUBJECTS.SAT_MATH]: CertificationInfo;
  [SUBJECTS.SAT_READING]: CertificationInfo;
  [REQUIRED_TRAINING.TUTORING_SKILLS]: CertificationInfo;
  [REQUIRED_TRAINING.COLLEGE_COUNSELING]: CertificationInfo;
}

export type AvailabilityDay = {
  [hour in HOURS]: boolean;
};

export type Availability = {
  [day in DAYS]: AvailabilityDay;
};
