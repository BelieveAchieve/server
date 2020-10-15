import { Student } from '../../models/Student';
import { Volunteer } from '../../models/Volunteer';
import { Types } from 'mongoose';
import {
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  SAT_CERTS
} from '../../constants';

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
