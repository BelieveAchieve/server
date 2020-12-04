import { Types } from 'mongoose';
import {
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  SAT_CERTS
} from '../constants';

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
  pastSessions: Types.ObjectId[] | Session[];
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

interface Subjects {
  subject: string;
  isActivated: boolean;
}

// @todo: clean up - use the Volunteer interface from Volunteer.ts when available
export interface Volunteer extends User {
  zipCode: string;
  college: string;
  volunteerPartnerOrg?: string;
  favoriteAcademicSubject?: string;
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
  subjects: Array<Subjects>;
  trainingCourses: TrainingCourses;
  sentReadyToCoachEmail: boolean;
  hoursTutored: Types.Decimal128;
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
  [MATH_CERTS.PREALGREBA]: CertificationInfo;
  [MATH_CERTS.ALGEBRA]: CertificationInfo;
  [MATH_CERTS.GEOMETRY]: CertificationInfo;
  [MATH_CERTS.TRIGONOMETRY]: CertificationInfo;
  [MATH_CERTS.PRECALCULUS]: CertificationInfo;
  [MATH_CERTS.CALCULUS_AB]: CertificationInfo;
  [MATH_CERTS.CALCULUS_BC]: CertificationInfo;
  [MATH_CERTS.STATISTICS]: CertificationInfo;
  [SCIENCE_CERTS.BIOLOGY]: CertificationInfo;
  [SCIENCE_CERTS.CHEMISTRY]: CertificationInfo;
  [SCIENCE_CERTS.PHYSICS_ONE]: CertificationInfo;
  [SCIENCE_CERTS.PHYSICS_TWO]: CertificationInfo;
  [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]: CertificationInfo;
  [COLLEGE_CERTS.ESSAYS]: CertificationInfo;
  [COLLEGE_CERTS.FINANCIAL_AID]: CertificationInfo;
  [COLLEGE_CERTS.SPORTS_RECRUITMENT_PLANNING]: CertificationInfo;
  [SAT_CERTS.SAT_MATH]: CertificationInfo;
  [SAT_CERTS.SAT_READING]: CertificationInfo;
  [TRAINING.UPCHIEVE_101]: CertificationInfo;
  [TRAINING.TUTORING_SKILLS]: CertificationInfo;
  [TRAINING.COLLEGE_COUNSELING]: CertificationInfo;
  [TRAINING.COLLEGE_SKILLS]: CertificationInfo;
  [TRAINING.SAT_STRATEGIES]: CertificationInfo;
}

export type AvailabilityDay = {
  [hour in HOURS]: boolean;
};

export type Availability = {
  [day in DAYS]: AvailabilityDay;
};

interface TrainingCourseData {
  isComplete: boolean;
  progress: number;
  completedMaterials: Array<string>;
}

export interface TrainingCourses {
  [TRAINING.UPCHIEVE_101]: TrainingCourseData;
  [TRAINING.TUTORING_SKILLS]: TrainingCourseData;
  [TRAINING.COLLEGE_COUNSELING]: TrainingCourseData;
  [TRAINING.COLLEGE_SKILLS]: TrainingCourseData;
  [TRAINING.SAT_STRATEGIES]: TrainingCourseData;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNotifications: (n: any) => any;
  _id: Types.ObjectId;
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
  reviewStatus: string;
  flags: string[];
  reviewedStudent: boolean;
  reviewedVolunteer: boolean;
}
