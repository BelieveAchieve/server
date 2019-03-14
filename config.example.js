// Server configuration

module.exports = {
  host: process.env.SERVER_HOST || 'localhost:3000',
  database: 'mongodb://localhost:27017/upchieve',
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  saltRounds: 10,
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    templateId: '142a621c-127a-46a1-b36a-d0689fd07877'
  },
  mail: {
    senders: {
      noreply: 'noreply@upchieve.org'
    }
  },
  client: {
    host: 'localhost:8080'
  },
  socketsPort: 3001,

  // Twilio Credentials
  accountSid: '',
  authToken: '',
  sendingNumber: '',

  cleanSpeakApiKey: '',

  VOLUNTEER_CODES: process.env.UPCHIEVE_VOLUNTEER_CODES || '',
  STUDENT_CODES: process.env.UPCHIEVE_STUDENT_CODES || ''
}
