import faker from 'faker';
import { Test } from 'supertest';
import { Types } from 'mongoose';
import base64url from 'base64url';
import { merge } from 'lodash';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Session } from '../../models/Session';
import { Message } from '../../models/Message'
import {
  Volunteer,
  Certifications,
  TrainingCourses,
  Reference,
  Availability
} from '../../models/Volunteer';
import {
  // @todo: figure out how to import from Volunteer.ts without DAYS and HOURS resolving to undefined
  DAYS,
  HOURS,
  StudentRegistrationForm,
  VolunteerRegistrationForm
} from '../utils/types';
import {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  SAT_CERTS
} from '../../constants';
export const getEmail = faker.internet.email;
export const getFirstName = faker.name.firstName;
export const getLastName = faker.name.lastName;
export const getId = faker.random.uuid;

const generateReferralCode = (userId): string =>
  base64url(Buffer.from(userId, 'hex'));

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
    hoursTutored: 0,
    ...overrides
  };

  return volunteer;
};

export const buildStudentRegistrationForm = (
  overrides = {}
): Partial<StudentRegistrationForm> => {
  const student = buildStudent();
  const form = {
    terms: true,
    ...student,
    ...overrides
  };

  return form;
};

export const buildVolunteerRegistrationForm = (
  overrides = {}
): Partial<VolunteerRegistrationForm> => {
  const volunteer = buildVolunteer();
  const form = {
    terms: true,
    ...volunteer,
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

export const authLogin = (agent, { email, password }: Partial<User>): Test =>
  agent
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ email, password });
