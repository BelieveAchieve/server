const config = require('../config')
const sgMail = require('@sendgrid/mail')
const isCertified = require('../utils/is-certified')

sgMail.setApiKey(config.sendgrid.apiKey)

const sendEmail = function(
  toEmail,
  fromEmail,
  fromName,
  templateId,
  dynamicData,
  unsubscribeGroupId,
  callback
) {
  // Unsubscribe email preferences
  const asm = {
    group_id: unsubscribeGroupId,
    groups_to_display: [config.sendgrid.unsubscribeGroup.newsletter]
  }
  const msg = {
    to: toEmail,
    from: {
      email: fromEmail,
      name: fromName
    },
    reply_to: {
      email: config.mail.receivers.support
    },
    templateId: templateId,
    dynamic_template_data: dynamicData,
    asm
  }

  sgMail.send(msg, callback)
}

module.exports = {
  sendVerification: function(options, callback) {
    const email = options.email
    const token = options.token
    const url = 'http://' + config.client.host + '/action/verify/' + token

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.verifyTemplate,
      {
        userEmail: email,
        verifyLink: url
      },
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  },

  sendContactForm: function(options, callback) {
    const email = options.email
    const responseData = options.responseData

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.contactTemplate,
      responseData,
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  },

  sendReset: function(options, callback) {
    const email = options.email
    const token = options.token
    const url = 'http://' + config.client.host + '/setpassword/' + token

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.resetTemplate,
      {
        userEmail: email,
        resetLink: url
      },
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  },

  sendPartnerOrgSignupAlert: function(options, callback) {
    sendEmail(
      config.mail.receivers.staff,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.partnerOrgSignupAlertTemplate,
      {
        name: options.name,
        email: options.email,
        company: options.company,
        upchieveId: options.upchieveId
      },
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  },

  sendWelcomeEmail: function(options, callback) {
    const email = options.email
    const firstName = options.firstName
    const firstNameCapitalized =
      firstName.charAt(0).toUpperCase() + firstName.slice(1)
    const coachGuideLink = 'http://' + config.client.host + '/coach-guide'
    const scheduleLink = 'http://' + config.client.host + '/calendar'
    const trainingLink = 'http://' + config.client.host + '/training'

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.welcomeTemplate,
      {
        firstName: firstNameCapitalized,
        coachGuideLink,
        scheduleLink,
        trainingLink
      },
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  },

  sendFinishOnboardingEmail: function(options, callback) {
    const {
      availabilityLastModifiedAt,
      certifications,
      firstname: firstName,
      email
    } = options.volunteer
    const firstNameCapitalized =
      firstName.charAt(0).toUpperCase() + firstName.slice(1)

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.testTemplate,
      {
        firstName: firstNameCapitalized,
        isCertified: isCertified(certifications),
        availabilityLastModifiedAt: !!availabilityLastModifiedAt
      },
      config.sendgrid.unsubscribeGroup.account,
      callback
    )
  }
}
