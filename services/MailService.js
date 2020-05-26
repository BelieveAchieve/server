const config = require('../config')
const sgMail = require('@sendgrid/mail')
const { capitalize } = require('lodash')

sgMail.setApiKey(config.sendgrid.apiKey)

const sendEmail = (
  toEmail,
  fromEmail,
  fromName,
  templateId,
  dynamicData,
  unsubscribeGroupId,
  callback
) => {
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
  sendVerification: ({ email, token }) => {
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
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendContactForm: ({ email, responseData }, callback) => {
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

  sendReset: ({ email, token }, callback) => {
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

  sendPartnerOrgSignupAlert: ({ name, email, company, upchieveId }) => {
    sendEmail(
      config.mail.receivers.staff,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.partnerOrgSignupAlertTemplate,
      {
        name,
        email,
        company,
        upchieveId
      },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendVolunteerWelcomeEmail: ({ email, firstName }) => {
    const { host } = config.client
    const coachGuideLink = `http://${host}/coach-guide`
    const scheduleLink = `http://${host}/calendar`
    const trainingLink = `http://${host}/training`

    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.volunteerWelcomeTemplate,
      {
        firstName: capitalize(firstName),
        coachGuideLink,
        scheduleLink,
        trainingLink
      },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendStudentWelcomeEmail: ({ email, firstName }) => {
    sendEmail(
      email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.studentWelcomeTemplate,
      {
        firstName: capitalize(firstName)
      },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendReportedSessionAlert: ({ sessionId, reportedByEmail, reportMessage }) => {
    return sendEmail(
      config.mail.receivers.staff,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.reportedSessionAlertTemplate,
      { sessionId, reportedByEmail, reportMessage },
      config.sendgrid.unsubscribeGroup.account
    )
  }
}
