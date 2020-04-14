// Server configuration

module.exports = {
  NODE_ENV: 'dev',
  SSL_CERT_PATH: '',
  // set host to your public IP address to test Twilio voice calling
  host: process.env.SERVER_HOST || 'localhost:3000',
  database: 'mongodb://localhost:27017/upchieve',
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  sessionCookieMaxAge: process.env.SESSION_COOKIE_MAX_AGE || 5184000000,
  saltRounds: 10,
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    contactTemplate: 'd-e79546f380874c58965c163f45df2ef4',
    verifyTemplate: 'd-02281875a1cf4575bd3568e674faf147',
    resetTemplate: 'd-5005d2beb2ad49a883a10364f3e14b81',
    partnerOrgSignupAlertTemplate: 'd-238200a8df0d4493b12defbf472901b9',
    welcomeTemplate: 'd-58fdc5f84f9e4ecbbda3d3c0cd4aa7fa',
    unsubscribeGroup: {
      newsletter: 12567,
      account: 12570
    }
  },
  mail: {
    senders: {
      noreply: 'noreply@upchieve.org'
    },
    receivers: {
      contact: 'staff@upchieve.org',
      staff: 'staff@upchieve.org',
      support: 'support@upchieve.org'
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
      highSchoolSignup: false,
      highSchoolSignupRequired: false
    },
    example2: {
      name: 'Example - School Optional',
      highSchoolSignup: true,
      highSchoolSignupRequired: false
    },
    example3: {
      name: 'Example - School Required',
      highSchoolSignup: true,
      highSchoolSignupRequired: true
    }
  },

  // Sentry Data Source Name
  sentryDsn: '',

  // Twilio Credentials
  accountSid: '',
  authToken: '',
  sendingNumber: '',

  // Failsafe notification options
  // time until second (desperate) SMS message is sent
  desperateSMSTimeout: 300000,
  // time until voice call is made
  desperateVoiceTimeout: 600000,
  // voice to use to render speech
  voice: 'man',

  VOLUNTEER_CODES: process.env.UPCHIEVE_VOLUNTEER_CODES || '',
  STUDENT_CODES: process.env.UPCHIEVE_STUDENT_CODES || ''
}
