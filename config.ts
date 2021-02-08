// Server configuration

import { Static } from 'runtypes';
import { Config } from './config-type';

const mongoHost = process.env.SUBWAY_DB_HOST || 'mongodb';
const mongoPort = process.env.SUBWAY_DB_PORT || '27017';
const mongoName = process.env.SUBWAY_DB_NAME || 'upchieve';
const mongoPass = process.env.SUBWAY_DB_PASS;
const mongoUser = process.env.SUBWAY_DB_USER;

let mongoConn;
if (mongoPass) {
  mongoConn = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoHost}/${mongoName}`;
} else {
  mongoConn = `mongodb://${mongoHost}:${mongoPort}/${mongoName}`;
}

const redisHost = process.env.SUBWAY_REDIS_HOST || 'cache';
const redisPort = process.env.SUBWAY_REDIS_PORT || '6379';
const redisConn = `redis://${redisHost}:${redisPort}`;

const bannedServiceProviderList =
  process.env.SUBWAY_BANNED_SERVICE_PROVIDERS || 'Example';
const bannedServiceProviders = bannedServiceProviderList.split(',');

let nodeEnv = process.env.NODE_ENV;
if (nodeEnv !== 'dev' && nodeEnv !== 'staging' && nodeEnv !== 'production') {
  nodeEnv = 'dev';
}

const config: Static<typeof Config> = {
  NODE_ENV: nodeEnv,
  SSL_CERT_PATH: '',
  // set host to your public IP address to test Twilio voice calling
  host: process.env.SUBWAY_SERVER_HOST || 'localhost:3000',
  database: mongoConn,
  sessionSecret: process.env.SUBWAY_SESSION_SECRET || 'secret',
  sessionCookieMaxAge:
    parseInt(process.env.SUBWAY_SESSION_COOKIE_MAX_AGE) || 5184000000,
  saltRounds: 10,
  sendgrid: {
    apiKey: process.env.SUBWAY_SENDGRID_API_KEY || '',
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
    weeklyHourSummaryEmailTemplate: 'd-19a5fbe8656249d2822c8bde1c2ab086',
    weeklyHourSummaryIntroEmailTemplate: 'd-4d8394e4da3847eabdfd23f257f7a8d3',
    unsubscribeGroup: {
      newsletter: 12567,
      account: 12570,
      volunteerSummary: 14543
    },
    contactList: {
      students:
        process.env.SUBWAY_STUDENT_CONTACT_LIST ||
        '1111111a-111b-111c-111d-11111111111e',
      volunteers:
        process.env.SUBWAY_VOLUNTEER_CONTACT_LIST ||
        '1111111a-111b-111c-111d-11111111111e'
    }
  },
  logLevel: process.env.SUBWAY_LOG_LEVEL || 'debug',
  mail: {
    senders: {
      noreply: process.env.SUBWAY_NOREPLY_EMAIL_SENDER || 'example@example.org',
      support: process.env.SUBWAY_SUPPORT_EMAIL_SENDER || 'example@example.org',
      recruitment:
        process.env.SUBWAY_RECRUITMENT_EMAIL_SENDER || 'example@example.org'
    },
    receivers: {
      contact:
        process.env.SUBWAY_CONTACT_EMAIL_RECEIVER || 'example@example.org',
      staff: process.env.SUBWAY_STAFF_EMAIL_RECEIVER || 'example@example.org',
      support:
        process.env.SUBWAY_SUPPORT_EMAIL_RECEIVER || 'example@example.org',
      recruitment:
        process.env.SUBWAY_RECRUITMENT_EMAIL_RECEIVER || 'example@example.org'
    }
  },
  client: {
    host: process.env.SUBWAY_CLIENT_HOST || 'localhost:8080'
  },
  socketsPort: Number(process.env.SUBWAY_SOCKETS_PORT) || 3001,

  volunteerPartnerManifestPath:
    process.env.SUBWAY_VOLUNTEER_PARTNER_MANIFEST_PATH ||
    'localManifests/volunteer.yaml',

  studentPartnerManifestPath:
    process.env.SUBWAY_STUDENT_PARTNER_MANIFEST_PATH ||
    'localManifests/student.yaml',

  // Sentry Data Source Name
  sentryDsn: process.env.SUBWAY_SENTRY_DSN || '',

  // Twilio Credentials
  accountSid: process.env.SUBWAY_TWILIO_ACCOUNT_SID || '',
  authToken: process.env.SUBWAY_TWILIO_AUTH_TOKEN || '',
  sendingNumber: process.env.SUBWAY_TWILIO_SENDING_NUMBER || '',

  notificationSchedule: [
    // Minute 1 (the time after a session request is made)
    1 * 60 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    // Minute 2
    1 * 60 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    // Minute 3
    1 * 60 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    12 * 1000,
    // Minute 6
    3 * 60 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000,
    // Minute 7
    1 * 60 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000,
    // Minute 8
    1 * 60 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000,
    5 * 1000
  ],
  // voice to use to render speech
  voice: 'man',

  workerQueueName: 'main',
  redisConnectionString: redisConn,
  firebase: {
    projectId: Number(process.env.SUBWAY_FIREBASE_PROJECT_ID) || 123456789012
  },
  bannedServiceProviders: bannedServiceProviders,
  awsS3: {
    accessKeyId: process.env.SUBWAY_AWS_ACCESSKEY || 'ACCESSKEY123',
    secretAccessKey:
      process.env.SUBWAY_SECRET_ACCESS_KEY || 'SECRETACCESSKEY789',
    region: process.env.SUBWAY_AWS_REGION || 'us-east-2',
    photoIdBucket: process.env.SUBWAY_PHOTO_ID_BUCKET || 'photo-id-bucket',
    sessionPhotoBucket:
      process.env.SUBWAY_SESSION_PHOTO_BUCKET || 'session-photo-bucket'
  },
  unleashId: process.env.SUBWAY_UNLEASH_ID || 'djwdKPaf7s3oxMgDrRrd',
  unleashName: process.env.SUBWAY_UNLEASH_NAME || 'dev',
  unleashUrl:
    process.env.SUBWAY_UNLEASH_URL ||
    'https://gitlab.com/api/v4/feature_flags/unleash/23285197',
  posthogToken: process.env.SUBWAY_POSTHOG_TOKEN || 'bogus'
};

module.exports = config;
export default config;
