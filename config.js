// Server configuration

module.exports = {
  environment: process.env.UPCHIEVE_SERVER_ENV,
  serverHost: process.env.UPCHIEVE_SERVER_HOST,
  serverPort: process.env.PORT || process.env.CLIENT_SERVER_PORT,
  clientHost: process.env.UPCHIEVE_CLIENT_HOST,
  clientPort: process.env.UPCHIEVE_CLIENT_PORT,
  dbHost: process.env.UPCHIEVE_SERVER_DB_HOST,
  sessionSecret: process.env.UPCHIEVE_SERVER_SESSION_SECRET,
  socketsPort: process.env.UPCHIEVE_SERVER_SOCKETS_PORT,
  saltRounds: 10,
  sendgridApiKey: process.env.UPCHIEVE_SENDGRID_API_KEY,
  sendgridTemplateId: process.env.UPCHIEVE_SENDGRID_TEMPLATE_ID,
  upchieveNoreplySender: process.env.UPCHIEVE_NOREPLY_SENDER,
  twilioAccountSid: process.env.UPCHIEVE_TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.UPCHIEVE_TWILIO_AUTH_TOKEN,
  twilioSendingNumber: process.env.UPCHIEVE_TWILIO_SENDING_NUMBER,
  cleanSpeakApiKey: process.env.UPCHIEVE_CLEANSPEAK_API_KEY,
  letsencryptDir: process.env.UPCHIEVE_LETSENCRYPT_DIR,
  volunteerCodes: process.env.UPCHIEVE_VOLUNTEER_CODES,
  studentCodes: process.env.UPCHIEVE_STUDENT_CODES,
  isProd: () => this.environment === 'production'
}
