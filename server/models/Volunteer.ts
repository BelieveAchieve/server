import { Document, Schema, Types } from 'mongoose';
import { values } from 'lodash';
import {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  SUBJECTS,
  TRAINING,
  MATH_CERTS,
  COLLEGE_CERTS,
  SCIENCE_CERTS,
  SAT_CERTS,
  COLLEGE_SUBJECTS
} from '../constants';
import UserModel, { User } from './User';

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

export type AvailabilityDay = {
  [hour in HOURS]: boolean;
};

export type Availability = {
  [day in DAYS]: AvailabilityDay;
};

export interface Reference extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  createdAt: Date;
  email: string;
  status: string;
  sentAt: Date;
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
  [COLLEGE_SUBJECTS.PLANNING]: CertificationInfo;
  [COLLEGE_SUBJECTS.APPLICATIONS]: CertificationInfo;
}

interface TrainingCourseData {
  isComplete: boolean;
  progress: number;
  completedMaterials: string[];
}

export interface TrainingCourses {
  [TRAINING.UPCHIEVE_101]: TrainingCourseData;
  [TRAINING.TUTORING_SKILLS]: TrainingCourseData;
  [TRAINING.COLLEGE_COUNSELING]: TrainingCourseData;
  [TRAINING.COLLEGE_SKILLS]: TrainingCourseData;
  [TRAINING.SAT_STRATEGIES]: TrainingCourseData;
}

export interface Volunteer extends User {
  volunteerPartnerOrg: string;
  isFailsafeVolunteer: boolean;
  phone: string;
  favoriteAcademicSubject: string;
  availability: Availability;
  timezone: string;
  availabilityLastModifiedAt: Date;
  elapsedAvailability: number;
  certifications: Certifications;
  isApproved: boolean;
  isOnboarded: boolean;
  photoIdS3Key: string;
  photoIdStatus: string;
  references: Reference[];
  occupation: string[];
  company: string;
  experience: {
    collegeCounseling: string;
    mentoring: string;
    tutoring: string;
  };
  languages: string[];
  country: string;
  state: string;
  city: string;
  sentReadyToCoachEmail: boolean;
  subjects: string[];
  trainingCourses: TrainingCourses;
  linkedInUrl: string;
  hoursTutored: Types.Decimal128;
  timeTutored: number;
  sentHourSummaryIntroEmail: boolean;
}

export type VolunteerDocument = Volunteer & Document;

const weeksSince = (date): number => {
  // 604800000 = milliseconds in a week
  return ((new Date().getTime() as number) - date) / 604800000;
};

const minsSince = (date): number => {
  // 60000 = milliseconds in a minute
  return ((new Date().getTime() as number) - date) / 60000;
};

const tallyVolunteerPoints = (volunteer): number => {
  let points = 0;

  // +2 points if no past sessions
  if (!volunteer.pastSessions || !volunteer.pastSessions.length) {
    points += 2;
  }

  // +1 point if volunteer is from a partner org
  if (volunteer.volunteerPartnerOrg) {
    points += 1;
  }

  // +1 point per 1 week since last notification
  if (volunteer.volunteerLastNotification) {
    points += weeksSince(new Date(volunteer.volunteerLastNotification.sentAt));
  } else {
    points += weeksSince(new Date(volunteer.createdAt));
  }

  // +1 point per 2 weeks since last session
  if (volunteer.volunteerLastSession) {
    points +=
      0.5 * weeksSince(new Date(volunteer.volunteerLastSession.createdAt));
  } else {
    points += weeksSince(new Date(volunteer.createdAt));
  }

  // -10000 points if notified recently
  if (
    volunteer.volunteerLastNotification &&
    minsSince(new Date(volunteer.volunteerLastNotification.sentAt)) < 5
  ) {
    points -= 10000;
  }

  return parseFloat(points.toFixed(2));
};

// subdocument schema for each availability day
const availabilityDaySchema = new Schema(
  {
    [HOURS['12AM']]: { type: Boolean, default: false },
    [HOURS['1AM']]: { type: Boolean, default: false },
    [HOURS['2AM']]: { type: Boolean, default: false },
    [HOURS['3AM']]: { type: Boolean, default: false },
    [HOURS['4AM']]: { type: Boolean, default: false },
    [HOURS['5AM']]: { type: Boolean, default: false },
    [HOURS['6AM']]: { type: Boolean, default: false },
    [HOURS['7AM']]: { type: Boolean, default: false },
    [HOURS['8AM']]: { type: Boolean, default: false },
    [HOURS['9AM']]: { type: Boolean, default: false },
    [HOURS['10AM']]: { type: Boolean, default: false },
    [HOURS['11AM']]: { type: Boolean, default: false },
    [HOURS['12PM']]: { type: Boolean, default: false },
    [HOURS['1PM']]: { type: Boolean, default: false },
    [HOURS['2PM']]: { type: Boolean, default: false },
    [HOURS['3PM']]: { type: Boolean, default: false },
    [HOURS['4PM']]: { type: Boolean, default: false },
    [HOURS['5PM']]: { type: Boolean, default: false },
    [HOURS['6PM']]: { type: Boolean, default: false },
    [HOURS['7PM']]: { type: Boolean, default: false },
    [HOURS['8PM']]: { type: Boolean, default: false },
    [HOURS['9PM']]: { type: Boolean, default: false },
    [HOURS['10PM']]: { type: Boolean, default: false },
    [HOURS['11PM']]: { type: Boolean, default: false }
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    [DAYS.SUNDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.MONDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.TUESDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.WEDNESDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.THURSDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.FRIDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    },
    [DAYS.SATURDAY]: {
      type: availabilityDaySchema,
      default: availabilityDaySchema
    }
  },
  { _id: false }
);

const referenceSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: values(REFERENCE_STATUS),
    default: REFERENCE_STATUS.UNSENT
  },
  sentAt: Date,
  affiliation: String,
  relationshipLength: String,
  patient: Number,
  positiveRoleModel: Number,
  agreeableAndApproachable: Number,
  communicatesEffectively: Number,
  trustworthyWithChildren: Number,
  rejectionReason: String,
  additionalInfo: String
});

const trainingCourseSchema = new Schema({
  isComplete: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  completedMaterials: {
    type: [String],
    default: []
  }
});

const volunteerSchemaOptions = {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
};

const volunteerSchema = new Schema(
  {
    isApproved: {
      type: Boolean,
      default: false
    },
    photoIdS3Key: String,
    photoIdStatus: {
      type: String,
      enum: values(PHOTO_ID_STATUS),
      default: PHOTO_ID_STATUS.EMPTY
    },
    references: [referenceSchema],
    isOnboarded: {
      type: Boolean,
      default: false
    },
    volunteerPartnerOrg: String,
    isFailsafeVolunteer: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      required: true,
      trim: true
      // @todo: server-side validation of international phone format
    },
    occupation: [String],
    experience: {
      collegeCounseling: String,
      mentoring: String,
      tutoring: String
    },
    country: String,
    state: String,
    city: String,
    company: String,
    languages: [String],
    linkedInUrl: String,
    availability: {
      type: availabilitySchema,
      default: availabilitySchema
    },
    timezone: String,
    hoursTutored: { type: Types.Decimal128, default: 0 },
    timeTutored: { type: Number, default: 0 },
    availabilityLastModifiedAt: { type: Date },
    elapsedAvailability: { type: Number, default: 0 },
    sentReadyToCoachEmail: {
      type: Boolean,
      default: false
    },
    trainingCourses: {
      [TRAINING.UPCHIEVE_101]: {
        type: trainingCourseSchema,
        default: trainingCourseSchema
      },
      [TRAINING.TUTORING_SKILLS]: {
        type: trainingCourseSchema,
        default: trainingCourseSchema
      },
      [TRAINING.COLLEGE_COUNSELING]: {
        type: trainingCourseSchema,
        default: trainingCourseSchema
      },
      [TRAINING.COLLEGE_SKILLS]: {
        type: trainingCourseSchema,
        default: trainingCourseSchema
      },
      [TRAINING.SAT_STRATEGIES]: {
        type: trainingCourseSchema,
        default: trainingCourseSchema
      }
    },
    certifications: {
      [MATH_CERTS.PREALGREBA]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.ALGEBRA]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.GEOMETRY]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.TRIGONOMETRY]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.PRECALCULUS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.CALCULUS_AB]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.CALCULUS_BC]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [MATH_CERTS.STATISTICS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [COLLEGE_CERTS.ESSAYS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      // @todo: remove once college counseling required training is created
      [COLLEGE_SUBJECTS.PLANNING]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      // @todo: remove once college counseling required training is created
      [SUBJECTS.APPLICATIONS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [COLLEGE_CERTS.FINANCIAL_AID]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [COLLEGE_CERTS.SPORTS_RECRUITMENT_PLANNING]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SCIENCE_CERTS.BIOLOGY]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SCIENCE_CERTS.CHEMISTRY]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SCIENCE_CERTS.PHYSICS_ONE]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SCIENCE_CERTS.PHYSICS_TWO]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [TRAINING.UPCHIEVE_101]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [TRAINING.TUTORING_SKILLS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [TRAINING.COLLEGE_COUNSELING]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [TRAINING.COLLEGE_SKILLS]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [TRAINING.SAT_STRATEGIES]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SAT_CERTS.SAT_MATH]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      [SAT_CERTS.SAT_READING]: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      }
    },
    subjects: {
      type: [String],
      enum: values(SUBJECTS)
    },
    sentHourSummaryIntroEmail: {
      type: Boolean,
      default: false
    }
  },
  volunteerSchemaOptions
);

volunteerSchema.virtual('volunteerPointRank').get(function() {
  if (!this.isVolunteer) return null;
  return tallyVolunteerPoints(this);
});

// Virtual that gets all notifications that this user has been sent
volunteerSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'volunteer',
  options: { sort: { sentAt: -1 } }
});

volunteerSchema.virtual('volunteerLastSession', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'volunteer',
  justOne: true,
  options: { sort: { createdAt: -1 } }
});

volunteerSchema.virtual('volunteerLastNotification', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'volunteer',
  justOne: true,
  options: { sort: { sentAt: -1 } }
});

// Use the user schema as the base schema for Volunteer
const VolunteerModel = UserModel.discriminator<VolunteerDocument>(
  'Volunteer',
  volunteerSchema
);

module.exports = VolunteerModel;
export default VolunteerModel;
