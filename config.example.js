// Server configuration

module.exports = {
  NODE_ENV: 'dev',
  SSL_CERT_PATH: '',
  // set host to your public IP address to test Twilio voice calling
  host: process.env.SERVER_HOST || 'localhost:3000',
  database: 'mongodb://localhost:27017/upchieve',
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  saltRounds: 10,
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    contactTemplate: 'd-e79546f380874c58965c163f45df2ef4',
    verifyTemplate: 'd-02281875a1cf4575bd3568e674faf147',
    resetTemplate: 'd-5005d2beb2ad49a883a10364f3e14b81'
  },
  mail: {
    senders: {
      noreply: 'noreply@upchieve.org'
    },
    receivers: {
      contact: 'staff@upchieve.org'
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
