import { Record, Literal, String, Number, Array } from 'runtypes';

export const Config = Record({
  NODE_ENV: String,
  SSL_CERT_PATH: String,
  host: String,
  database: String,
  sessionSecret: String,
  sessionCookieMaxAge: Number,
  saltRounds: Number,
  sendgrid: Record({
    apiKey: String,
    contactTemplate: String,
    verifyTemplate: String,
    resetTemplate: String,
    openVolunteerWelcomeTemplate: String,
    partnerVolunteerWelcomeTemplate: String,
    studentWelcomeTemplate: String,
    reportedSessionAlertTemplate: String,
    referenceFormTemplate: String,
    approvedNotOnboardedTemplate: String,
    openReadyToCoachTemplate: String,
    partnerReadyToCoachTemplate: String,
    bannedUserAlertTemplate: String,
    referenceFollowupTemplate: String,
    rejectedPhotoSubmissionTemplate: String,
    rejectedReferenceTemplate: String,
    waitingOnReferencesTemplate: String,
    niceToMeetYouTemplate: String,
    weeklyHourSummaryEmailTemplate: String,
    weeklyHourSummaryIntroEmailTemplate: String,
    unsubscribeGroup: Record({
      newsletter: Number,
      account: Number,
      volunteerSummary: Number
    }),
    contactList: Record({
      students: String,
      volunteers: String
    })
  }),
  logLevel: String,
  mail: Record({
    senders: Record({
      noreply: String,
      support: String,
      recruitment: String
    }),
    receivers: Record({
      contact: String,
      staff: String,
      support: String,
      recruitment: String
    })
  }),
  client: Record({
    host: String
  }),
  socketsPort: Number,
  volunteerPartnerManifestPath: String,
  studentPartnerManifestPath: String,

  // Sentry Data Source Name
  sentryDsn: String,

  // Twilio Credentials
  accountSid: String,
  authToken: String,
  sendingNumber: String,

  notificationSchedule: Array(Number),
  // voice to use to render speech
  voice: Literal('man'),

  workerQueueName: String,
  redisConnectionString: String,
  firebase: Record({
    projectId: Number
  }),
  bannedServiceProviders: Array(String),
  awsS3: Record({
    accessKeyId: String,
    secretAccessKey: String,
    region: String,
    photoIdBucket: String,
    sessionPhotoBucket: String
  }),
  unleashId: String,
  unleashName: String,
  unleashUrl: String,
  posthogToken: String,
  whiteboardStorageAppId: String,
  whiteboardStorageTenantId: String,
  whiteboardStorageSecret: String,
  whiteboardStorageSubscriptionId: String,
  whiteboardStorageAccountName: String,
  whiteboardStorageContainer: String
});
