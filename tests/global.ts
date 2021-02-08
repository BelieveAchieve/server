jest.mock('redis', () => {
  const redisMock = require('fakeredis');
  return {
    __esModule: true,
    default: redisMock
  };
});

jest.mock('posthog-node');
jest.mock('../services/AnalyticsService');

jest.mock('../config', () => {
  return {
    sessionSecret: 'secret',
    awsS3: {
      accessKeyId: 'ACCESSKEY123',
      secretAccessKey: 'SECRETACCESSKEY789',
      region: 'us-east-2',
      photoIdBucket: 'photo-id-bucket',
      sessionPhotoBucket: 'session-photo-bucket'
    },
    volunteerPartnerManifestPath: 'localManifests/volunteer.yaml',
    studentPartnerManifestPath: 'localManifests/student.yaml',
    sendgrid: {
      apiKey: ''
    },
    // process.env.MONGO_URL is set by '@shelf/jest-mongodb' when a test runs
    database: process.env.MONGO_URL,
    volunteerPartnerManifests: {
      example: {
        name: 'Example - Regular'
      },
      example2: {
        name: 'Example - Email Requirement',
        requiredEmailDomains: ['example.com']
      }
    },

    logLevel: 'info',

    studentPartnerManifests: {
      example: {
        name: 'Example - No School',
        signupCode: 'EX1',
        highSchoolSignup: false,
        schoolSignupRequired: false
      },
      example2: {
        name: 'Example - High School Optional',
        signupCode: 'EX2',
        highSchoolSignup: true,
        schoolSignupRequired: false
      }
    },
    bannedServiceProviders: ['Example'],
    notificationSchedule: [
      1 * 60 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      1 * 60 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      1 * 60 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      12 * 1000,
      3 * 60 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000,
      1 * 60 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000,
      1 * 60 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000,
      5 * 1000
    ]
  };
});

jest.mock('unleash-client', () => {
  return {
    isEnabled: (): boolean => true
  };
});
