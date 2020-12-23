// Server configuration

import { Static } from 'runtypes';
import { Config } from './config-type';

const config: Static<typeof Config> = {
  NODE_ENV: 'dev',
  SSL_CERT_PATH: '',
  // set host to your public IP address to test Twilio voice calling
  host: process.env.SERVER_HOST || 'localhost:3000',
  database: 'mongodb://mongodb:27017/upchieve',
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  sessionCookieMaxAge:
    parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 5184000000,
  saltRounds: 10,
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    contactTemplate: 'd-e79546f380874c58965c163f45df2ef4',
    verifyTemplate: 'd-02281875a1cf4575bd3568e674faf147',
    resetTemplate: 'd-5005d2beb2ad49a883a10364f3e14b81',
    openVolunteerWelcomeTemplate: 'd-0e4406696376446da0d580b9c7e9a95a',
    partnerVolunteerWelcomeTemplate: 'd-eac2fdfaa8d740c8965ba8011102986b',
    studentWelcomeTemplate: 'd-dba390e0c99545d4b18135d869046f50',
    reportedSessionAlertTemplate: 'd-fe338f96339445279c3fa6580fabc286',
    referenceFormTemplate: 'd-122f9c9953144e62b1f66411b8e85723',
    approvedNotOnboardedTemplate: 'd-2c7a974fc7084a9eaaa152f3498cc99d',
    openReadyToCoachTemplate: 'd-09ec01c51be54c108b7fae4481acfd38',
    partnerReadyToCoachTemplate: 'd-d2ba9920683b4bd4a159f496a2346583',
    bannedUserAlertTemplate: 'd-7be8a21a59664f99a1f540e43c79b793',
    referenceFollowupTemplate: 'd-6b0d96c0cf15469db7a5e6ec655cf37a',
    rejectedPhotoSubmissionTemplate: 'd-c6d146a9eb4e44f6acc94a29a131d50d',
    rejectedReferenceTemplate: 'd-9afea0862a264bbb93ed6a2c074fd6b4',
    waitingOnReferencesTemplate: 'd-65bf8204d28746f58ad28a4aa92407c7',
    niceToMeetYouTemplate: 'd-8afee528e5184d8797c50c109d6b631b',
    unsubscribeGroup: {
      newsletter: 12567,
      account: 12570
    },
    contactList: {
      students: '1111111a-111b-111c-111d-11111111111e',
      volunteers: '1111111a-111b-111c-111d-11111111111e'
    }
  },
  mail: {
    senders: {
      noreply: 'noreply@upchieve.org',
      support: 'support@upchieve.org',
      recruitment: 'recruitment@upchieve.org'
    },
    receivers: {
      contact: 'staff@upchieve.org',
      staff: 'staff@upchieve.org',
      support: 'support@upchieve.org',
      recruitment: 'recruitment@upchieve.org'
    }
  },
  client: {
    host: 'localhost:8080'
  },
  socketsPort: 3001,

  volunteerPartnerManifests: {
    example: {
      name: 'Example - Regular'
    },
    example2: {
      name: 'Example - Email Requirement',
      requiredEmailDomains: ['example.com']
    },
    example3: {
      name: 'Example - Email Requirement & Math Only',
      requiredEmailDomains: ['example.org', 'example.net']
    }
  },

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
    },
    example3: {
      name: 'Example - High School Required',
      signupCode: 'EX3',
      highSchoolSignup: true,
      schoolSignupRequired: true
    },
    example4: {
      name: 'Example - Sites, No School',
      signupCode: 'EX4',
      sites: ['Site A', 'Site B', 'Site C']
    },
    example5: {
      name: 'Example - College and High School Optional',
      signupCode: 'EX5',
      highSchoolSignup: true,
      collegeSignup: true,
      schoolSignupRequired: false
    }
  },

  // Sentry Data Source Name
  sentryDsn: '',

  // Twilio Credentials
  accountSid: '',
  authToken: '',
  sendingNumber: '',

  notificationSchedule: [
    30 * 1000,
    30 * 1000,
    30 * 1000,
    2 * 60 * 1000,
    30 * 1000,
    30 * 1000
  ],
  // Failsafe notification options
  // time until second (desperate) SMS message is sent
  desperateSMSTimeout: 300000,
  // time until voice call is made
  desperateVoiceTimeout: 600000,
  // voice to use to render speech
  voice: 'man',

  workerQueueName: 'main',
  redisConnectionString: 'redis://127.0.0.1:6379',
  firebase: {
    projectId: 123456789012
  },
  bannedServiceProviders: ['Example'],
  awsS3: {
    accessKeyId: 'ACCESSKEY123',
    secretAccessKey: 'SECRETACCESSKEY789',
    region: 'us-east-2',
    photoIdBucket: 'photo-id-bucket',
    sessionPhotoBucket: 'session-photo-bucket'
  }
};

module.exports = config;
export default config;
