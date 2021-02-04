import moment from 'moment-timezone';
import faker from 'faker';
import { Test } from 'supertest';
import { Types } from 'mongoose';
import base64url from 'base64url';
import { merge } from 'lodash';
import {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  COLLEGE_SUBJECTS,
  SAT_CERTS
} from '../constants';
import { Message } from '../models/Message';
import { AvailabilitySnapshot } from '../models/Availability/Snapshot';
import { AvailabilityHistory } from '../models/Availability/History';
import { UserAction } from '../models/UserAction';
import {
  AvailabilityDay,
  Availability,
  DAYS,
  HOURS
} from '../models/Availability/types';
import {
  Volunteer,
  Reference,
  TrainingCourses,
  Certifications
} from '../models/Volunteer';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Session } from '../models/Session';
import { StudentRegistrationForm, VolunteerRegistrationForm } from './types';
export const getEmail = faker.internet.email;
export const getFirstName = faker.name.firstName;
export const getLastName = faker.name.lastName;
export const getId = faker.random.uuid;
export const generateSentence = (): string => faker.lorem.sentence();

const generateReferralCode = (userId): string =>
  base64url(Buffer.from(userId, 'hex'));

export const getDayOfWeek = (): string => {
  return moment()
    .tz('America/New_York')
    .format('dddd');
};

// @todo: Figure out how to use with MATH_CERTS, SCIENCE_CERTS
export const buildCertifications = (overrides = {}): Certifications => {
  const certifications = {
    [MATH_CERTS.PREALGREBA]: { passed: false, tries: 0 },
    [MATH_CERTS.ALGEBRA]: { passed: false, tries: 0 },
    [MATH_CERTS.GEOMETRY]: { passed: false, tries: 0 },
    [MATH_CERTS.TRIGONOMETRY]: { passed: false, tries: 0 },
    [MATH_CERTS.PRECALCULUS]: { passed: false, tries: 0 },
    [MATH_CERTS.CALCULUS_AB]: { passed: false, tries: 0 },
    [MATH_CERTS.CALCULUS_BC]: { passed: false, tries: 0 },
    [MATH_CERTS.STATISTICS]: { passed: false, tries: 0 },
    [SCIENCE_CERTS.BIOLOGY]: { passed: false, tries: 0 },
    [SCIENCE_CERTS.CHEMISTRY]: { passed: false, tries: 0 },
    [SCIENCE_CERTS.PHYSICS_ONE]: { passed: false, tries: 0 },
    [SCIENCE_CERTS.PHYSICS_TWO]: { passed: false, tries: 0 },
    [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]: { passed: false, tries: 0 },
    [COLLEGE_CERTS.ESSAYS]: { passed: false, tries: 0 },
    [COLLEGE_CERTS.FINANCIAL_AID]: { passed: false, tries: 0 },
    [COLLEGE_CERTS.SPORTS_RECRUITMENT_PLANNING]: { passed: false, tries: 0 },
    [COLLEGE_SUBJECTS.PLANNING]: { passed: false, tries: 0 },
    [COLLEGE_SUBJECTS.APPLICATIONS]: { passed: false, tries: 0 },
    [SAT_CERTS.SAT_MATH]: { passed: false, tries: 0 },
    [SAT_CERTS.SAT_READING]: { passed: false, tries: 0 },
    [TRAINING.UPCHIEVE_101]: { passed: false, tries: 0 },
    [TRAINING.TUTORING_SKILLS]: { passed: false, tries: 0 },
    [TRAINING.COLLEGE_COUNSELING]: { passed: false, tries: 0 },
    [TRAINING.COLLEGE_SKILLS]: { passed: false, tries: 0 },
    [TRAINING.SAT_STRATEGIES]: { passed: false, tries: 0 },
    ...overrides
  };

  return certifications;
};

export const buildTrainingCourses = (overrides = {}): TrainingCourses => {
  const trainingCourses = {
    [TRAINING.UPCHIEVE_101]: {
      isComplete: false,
      progress: 0,
      completedMaterials: []
    },
    [TRAINING.TUTORING_SKILLS]: {
      isComplete: false,
      progress: 0,
      completedMaterials: []
    },
    [TRAINING.COLLEGE_COUNSELING]: {
      isComplete: false,
      progress: 0,
      completedMaterials: []
    },
    [TRAINING.COLLEGE_SKILLS]: {
      isComplete: false,
      progress: 0,
      completedMaterials: []
    },
    [TRAINING.SAT_STRATEGIES]: {
      isComplete: false,
      progress: 0,
      completedMaterials: []
    },
    ...overrides
  };
  return trainingCourses;
};

export const buildAvailability = (overrides = {}): Availability => {
  const availability = {} as Availability;
  for (const day in DAYS) {
    availability[DAYS[day]] = {};
    for (const hour in HOURS) {
      availability[DAYS[day]][HOURS[hour]] = false;
    }
  }

  const mergedAvailability = merge(availability, overrides);

  return mergedAvailability;
};

export const buildAvailabilitySnapshot = (
  overrides = {}
): AvailabilitySnapshot => {
  const currentDate = new Date();
  return {
    _id: Types.ObjectId(),
    onCallAvailability: buildAvailability(),
    modifiedAt: currentDate,
    createdAt: currentDate,
    timezone: 'America/New_York',
    volunteerId: Types.ObjectId(),
    ...overrides
  };
};

export const buildAvailabilityHistory = (
  overrides = {}
): AvailabilityHistory => {
  const currentDate = new Date();
  return {
    _id: Types.ObjectId(),
    availability: buildAvailability()[getDayOfWeek()],
    date: currentDate,
    modifiedAt: currentDate,
    createdAt: currentDate,
    timezone: 'America/New_York',
    volunteerId: Types.ObjectId(),
    ...overrides
  };
};

export const buildStudent = (overrides = {}): Partial<Student> => {
  const firstName = getFirstName();
  const lastName = getLastName();
  const _id = Types.ObjectId();
  const student = {
    _id,
    email: getEmail().toLowerCase(),
    firstName,
    lastName,
    firstname: firstName,
    lastname: lastName,
    highSchoolId: '23456789',
    password: 'Password123',
    zipCode: '11201',
    studentPartnerOrg: 'example',
    referredByCode: '',
    referralCode: generateReferralCode(_id.toString()),
    pastSessions: [],
    createdAt: new Date(),
    ...overrides
  };

  return student;
};

export const buildVolunteer = (overrides = {}): Partial<Volunteer> => {
  const firstName = getFirstName();
  const lastName = getLastName();
  const _id = Types.ObjectId();
  const volunteer = {
    _id,
    email: getEmail().toLowerCase(),
    firstName,
    lastName,
    firstname: firstName,
    lastname: lastName,
    password: 'Password123',
    zipCode: '11201',
    referredByCode: '',
    college: 'Columbia University',
    phone: '+12345678910',
    referralCode: generateReferralCode(_id.toString()),
    isApproved: false,
    isOnboarded: false,
    certifications: buildCertifications(),
    availability: buildAvailability(),
    subjects: [],
    trainingCourses: buildTrainingCourses(),
    sentReadyToCoachEmail: false,
    hoursTutored: Types.Decimal128.fromString('0'),
    timeTutored: 0,
    pastSessions: [],
    createdAt: new Date(),
    elapsedAvailability: 0,
    sentHourSummaryIntroEmail: false,
    ...overrides
  };

  return volunteer;
};

export const buildStudentRegistrationForm = (
  overrides: Partial<StudentRegistrationForm> = {}
): StudentRegistrationForm => {
  const student = buildStudent();
  const form = {
    zipCode: student.zipCode,
    firstName: student.firstname,
    lastName: student.lastname,
    email: student.email,
    password: student.password,
    highSchoolId: '11111111',
    terms: true,
    ...overrides
  };

  return form;
};

export const buildVolunteerRegistrationForm = (
  overrides: Partial<VolunteerRegistrationForm> = {}
): VolunteerRegistrationForm => {
  const volunteer = buildVolunteer();
  const form = {
    firstName: volunteer.firstname,
    lastName: volunteer.lastname,
    email: volunteer.email,
    password: volunteer.password,
    phone: volunteer.phone,
    terms: true,
    ...overrides
  };

  return form;
};

export const buildReference = (overrides = {}): Partial<Reference> => {
  const referenceFirstName = getFirstName();
  const referenceLastName = getLastName();
  const referenceEmail = getEmail();
  const reference = {
    _id: Types.ObjectId(),
    firstName: referenceFirstName,
    lastName: referenceLastName,
    email: referenceEmail,
    ...overrides
  };

  return reference;
};

export const buildReferenceForm = (overrides = {}): Partial<Reference> => {
  const randomNumToSix = (): number => Math.floor(Math.random() * 6) + 1;
  const randomNumToFive = (): number => Math.floor(Math.random() * 5) + 1;
  const form = {
    affiliation: faker.lorem.word(),
    relationshipLength: faker.lorem.word(),
    rejectionReason: faker.lorem.word(),
    additionalInfo: faker.lorem.sentence(),
    patient: randomNumToSix(),
    positiveRoleModel: randomNumToSix(),
    agreeableAndApproachable: randomNumToSix(),
    communicatesEffectively: randomNumToSix(),
    trustworthyWithChildren: randomNumToFive(),
    status: REFERENCE_STATUS.SUBMITTED,
    ...overrides
  };

  return form;
};

export const buildReferenceWithForm = (overrides = {}): Partial<Reference> => {
  const data = {
    ...buildReferenceForm(),
    ...buildReference(),
    ...overrides
  };

  return data;
};

export const buildPhotoIdData = (overrides = {}): Partial<Volunteer> => {
  const data = {
    photoIdS3Key: getId(),
    photoIdStatus: PHOTO_ID_STATUS.SUBMITTED,
    ...overrides
  };

  return data;
};

export const buildBackgroundInfo = (overrides = {}): Partial<Volunteer> => {
  const data = {
    occupation: ['An undergraduate student'],
    experience: {
      collegeCounseling: 'No prior experience',
      mentoring: '1-2 years',
      tutoring: '0-1 years'
    },
    languages: ['Spanish'],
    country: 'United States of America',
    state: 'New York',
    city: 'New York City',
    ...overrides
  };

  return data;
};

export const buildSession = (overrides = {}): Partial<Session> => {
  const _id = Types.ObjectId();
  const session = {
    _id,
    student: null,
    volunteer: null,
    type: 'math',
    subTopic: 'algebra',
    messages: [],
    whiteboardDoc: '',
    quillDoc: '',
    createdAt: new Date(),
    volunteerJoinedAt: null,
    failedJoins: [],
    notifications: [],
    photos: [],
    isReported: false,
    reportReason: null,
    reportMessage: null,
    timeTutored: 0,
    ...overrides
  };

  return session;
};

export const buildMessage = (overrides = {}): Partial<Message> => {
  const _id = Types.ObjectId();
  const message = {
    _id,
    user: null,
    contents: faker.lorem.sentence(),
    createdAt: new Date(),
    ...overrides
  };

  return message;
};

export const buildPastSessions = (): Types.ObjectId[] => {
  const pastSession = buildSession();
  const pastSessions = [pastSession._id];

  return pastSessions;
};

/**
 * 
 * @todo: use Partial<Notification> instead of Partial<any>
 * Enums NotificationMethod & NotificationType do not exists at runtime, so
 * a type error like "Cannot read property 'SMS' of undefined" is thrown
 * 
 **/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildNotification = (overrides = {}): Partial<any> => {
  const _id = Types.ObjectId();

  const notification = {
    _id,
    sentAt: new Date(),
    // @todo:  use NotificationMethod from models/Notification
    method: 'SMS',
    volunteer: null,
    // @todo:  use NotificationType from models/Notification
    type: 'REGULAR',
    wasSuccessful: true,
    messageId: 'message123',
    ...overrides
  };

  return notification;
};

export const buildUserAction = (
  overrides: Partial<UserAction> = {}
): Partial<UserAction> => {
  const userAction = {
    _id: Types.ObjectId(),
    user: null,
    session: null,
    createdAt: new Date(),
    actionType: null,
    action: null,
    quizCategory: null,
    quizSubcategory: null,
    device: null,
    browser: null,
    browserVersion: null,
    operatingSystem: null,
    operatingSystemVersion: null,
    ipAddress: null,
    referenceEmail: null,
    banReason: null,
    ...overrides
  };

  return userAction;
};

export const buildAvailabilityDay = (overrides = {}): AvailabilityDay => {
  const availabilityDay = {
    '12a': false,
    '1a': false,
    '2a': false,
    '3a': false,
    '4a': false,
    '5a': false,
    '6a': false,
    '7a': false,
    '8a': false,
    '9a': false,
    '10a': false,
    '11a': false,
    '12p': false,
    '1p': false,
    '2p': false,
    '3p': false,
    '4p': false,
    '5p': false,
    '6p': false,
    '7p': false,
    '8p': false,
    '9p': false,
    '10p': false,
    '11p': false,
    ...overrides
  };

  return availabilityDay;
};

export const authLogin = (agent, { email, password }: Partial<User>): Test =>
  agent
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ email, password });
