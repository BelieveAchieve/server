import {
  Record,
  Union,
  Literal,
  String,
  Number,
  Array,
  Dictionary,
  Boolean,
  Partial
} from 'runtypes';

export const Config = Record({
  NODE_ENV: Union(Literal('dev'), Literal('staging'), Literal('production')),
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
    partnerOrgSignupAlertTemplate: String,
    volunteerWelcomeTemplate: String,
    studentWelcomeTemplate: String,
    unsubscribeGroup: Record({
      newsletter: Number,
      account: Number
    })
  }),
  mail: Record({
    senders: Record({
      noreply: String
    }),
    receivers: Record({
      contact: String,
      staff: String,
      support: String
    })
  }),
  client: Record({
    host: String
  }),
  socketsPort: Number,
  volunteerPartnerManifests: Dictionary(
    Record({
      name: String
    }).And(
      Partial({
        requiredEmailDomains: Array(String),
        mathCoachingOnly: Boolean
      })
    )
  ),
  studentPartnerManifests: Dictionary(
    Partial({
      name: String,
      signupCode: String,
      highSchoolSignup: Boolean,
      highSchoolSignupRequired: Boolean
    })
  ),

  // Sentry Data Source Name
  sentryDsn: String,

  // Twilio Credentials
  accountSid: String,
  authToken: String,
  sendingNumber: String,

  notificationSchedule: Array(Number),
  // Failsafe notification options
  // time until second (desperate) SMS message is sent
  desperateSMSTimeout: Number,
  // time until voice call is made
  desperateVoiceTimeout: Number,
  // voice to use to render speech
  voice: Literal('man'),

  VOLUNTEER_CODES: String,
  STUDENT_CODES: String,
  workerQueueName: String,
  redisConnectionString: String,
  firebase: Record({
    projectId: Number
  })
});
