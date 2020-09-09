import { Types } from 'mongoose';

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
  sentReadyToCoachEmail: boolean;
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

export enum SUBJECTS {
  PREALGREBA = 'prealgebra',
  ALGREBA = 'algebra',
  GEOMETRY = 'geometry',
  TRIGONOMETRY = 'trigonometry',
  PRECALCULUS = 'precalculus',
  CALCULUS = 'calculus',
  INTEGRATED_MATH_ONE = 'integratedMathOne',
  INTEGRATED_MATH_TWO = 'integratedMathTwo',
  INTEGRATED_MATH_THREE = 'integratedMathThree',
  INTEGRATED_MATH_FOUR = 'integratedMathFour',
  APPLICATIONS = 'applications',
  ESSAYS = 'essays',
  PLANNING = 'planning',
  BIOLOGY = 'biology',
  CHEMISTRY = 'chemistry',
  PHYSICS_ONE = 'physicsOne'
}

export interface CertificationInfo {
  passed: boolean;
  tries: number;
  lastAttemptedAt?: Date;
}

export interface Certifications {
  [SUBJECTS.PREALGREBA]: CertificationInfo;
  [SUBJECTS.ALGREBA]: CertificationInfo;
  [SUBJECTS.GEOMETRY]: CertificationInfo;
  [SUBJECTS.TRIGONOMETRY]: CertificationInfo;
  [SUBJECTS.PRECALCULUS]: CertificationInfo;
  [SUBJECTS.CALCULUS]: CertificationInfo;
  [SUBJECTS.INTEGRATED_MATH_ONE]: CertificationInfo;
  [SUBJECTS.INTEGRATED_MATH_TWO]: CertificationInfo;
  [SUBJECTS.INTEGRATED_MATH_THREE]: CertificationInfo;
  [SUBJECTS.INTEGRATED_MATH_FOUR]: CertificationInfo;
  [SUBJECTS.APPLICATIONS]: CertificationInfo;
  [SUBJECTS.ESSAYS]: CertificationInfo;
  [SUBJECTS.PLANNING]: CertificationInfo;
  [SUBJECTS.BIOLOGY]: CertificationInfo;
  [SUBJECTS.CHEMISTRY]: CertificationInfo;
  [SUBJECTS.PHYSICS_ONE]: CertificationInfo;
}

export type AvailabilityDay = {
  [hour in HOURS]: boolean;
};

export type Availability = {
  [day in DAYS]: AvailabilityDay;
};

export interface Message {
  user: User;
  contents: string;
  createdAt: Date;
}

// @todo: clean up
enum NotificationType {
  REGULAR = 'REGULAR',
  FAILSAFE = 'FAILSAFE'
}

enum NotificationMethod {
  SMS = 'SMS',
  VOICE = 'VOICE',
  EMAIL = 'EMAIL'
}

export interface Notification {
  _id: Types.ObjectId;
  volunteer: Types.ObjectId | Volunteer;
  sentAt: Date;
  type: NotificationType;
  method: NotificationMethod;
  wasSuccessful: boolean;
  messageId: string;
}

export interface Session {
  student: Student;
  volunteer: Volunteer;
  type: string;
  subTopic: string;
  messages: Message[];
  whiteboardDoc: string;
  quillDoc: string;
  createdAt: Date;
  volunteerJoinedAt: Date;
  failedJoins: User[];
  endedAt: Date;
  endedBy: User;
  notifications: Notification[];
  photos: string[];
  isReported: boolean;
  reportReason: string;
  reportMessage: string;
}
