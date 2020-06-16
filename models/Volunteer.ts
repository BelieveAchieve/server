import mongoose from 'mongoose';
import { PHOTO_ID_STATUS, REFERENCE_STATUS } from '../constants';
import User from './User';

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
const availabilityDaySchema = new mongoose.Schema(
  {
    '12a': { type: Boolean, default: false },
    '1a': { type: Boolean, default: false },
    '2a': { type: Boolean, default: false },
    '3a': { type: Boolean, default: false },
    '4a': { type: Boolean, default: false },
    '5a': { type: Boolean, default: false },
    '6a': { type: Boolean, default: false },
    '7a': { type: Boolean, default: false },
    '8a': { type: Boolean, default: false },
    '9a': { type: Boolean, default: false },
    '10a': { type: Boolean, default: false },
    '11a': { type: Boolean, default: false },
    '12p': { type: Boolean, default: false },
    '1p': { type: Boolean, default: false },
    '2p': { type: Boolean, default: false },
    '3p': { type: Boolean, default: false },
    '4p': { type: Boolean, default: false },
    '5p': { type: Boolean, default: false },
    '6p': { type: Boolean, default: false },
    '7p': { type: Boolean, default: false },
    '8p': { type: Boolean, default: false },
    '9p': { type: Boolean, default: false },
    '10p': { type: Boolean, default: false },
    '11p': { type: Boolean, default: false }
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    Sunday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Monday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Tuesday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Wednesday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Thursday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Friday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Saturday: { type: availabilityDaySchema, default: availabilityDaySchema }
  },
  { _id: false }
);

const referenceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: [
      REFERENCE_STATUS.UNSENT,
      REFERENCE_STATUS.SENT,
      REFERENCE_STATUS.SUBMITTED,
      REFERENCE_STATUS.APPROVED,
      REFERENCE_STATUS.REJECTED
    ],
    default: REFERENCE_STATUS.UNSENT
  },
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

const volunteerSchemaOptions = {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
};

const volunteerSchema = new mongoose.Schema(
  {
    isApproved: {
      type: Boolean,
      default: false
    },
    photoIdUrl: {
      type: String,
      select: false
    },
    photoIdStatus: {
      type: String,
      enum: [
        PHOTO_ID_STATUS.EMPTY,
        PHOTO_ID_STATUS.PENDING,
        PHOTO_ID_STATUS.REJECTED,
        PHOTO_ID_STATUS.APPROVED
      ],
      default: PHOTO_ID_STATUS.EMPTY
    },
    linkedInUrl: String,
    references: [referenceSchema],

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
    favoriteAcademicSubject: String,
    college: String,

    availability: {
      type: availabilitySchema,
      default: availabilitySchema
    },
    timezone: String,
    availabilityLastModifiedAt: { type: Date },
    elapsedAvailability: { type: Number, default: 0 },

    certifications: {
      prealgebra: {
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
      algebra: {
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
      geometry: {
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
      trigonometry: {
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
      precalculus: {
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
      calculus: {
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
      integratedMathOne: {
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
      integratedMathTwo: {
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
      integratedMathThree: {
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
      integratedMathFour: {
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
      applications: {
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
      essays: {
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
      planning: {
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
      biology: {
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
      chemistry: {
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
      physicsOne: {
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

volunteerSchema.virtual('isOnboarded').get(function() {
  if (!this.isVolunteer) return null;
  const certifications = this.certifications.toObject();
  let isCertified = false;

  for (const subject in certifications) {
    if (
      certifications.hasOwnProperty(subject) &&
      certifications[subject].passed
    ) {
      isCertified = true;
      break;
    }
  }

  return !!this.availabilityLastModifiedAt && isCertified;
});

// Use the user schema as the base schema for Volunteer
const Volunteer = User.discriminator('Volunteer', volunteerSchema);

module.exports = Volunteer;
export default Volunteer;
