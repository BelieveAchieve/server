const config = require('../config')
const sgMail = require('@sendgrid/mail')
const axios = require('axios')

sgMail.setApiKey(config.sendgrid.apiKey)

const options = {
  headers: {
    Authorization: `Bearer ${config.sendgrid.apiKey}`,
    'content-type': 'application/json'
  }
}

const putContact = data =>
  axios.put('https://api.sendgrid.com/v3/marketing/contacts', data, options)

const getCustomFields = async () => {
  const response = await axios.get(
    'https://api.sendgrid.com/v3/marketing/field_definitions',
    options
  )

  const {
    data: { custom_fields: sendGridCustomFields }
  } = response

  const customFields = {}
  for (const field of sendGridCustomFields) {
    customFields[field.name] = field.id
  }

  return customFields
}

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
        firstName,
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
      { firstName },
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
  },

  createContact: async user => {
    const customFields = await getCustomFields()

    const contactListId = user.isVolunteer
      ? config.sendgrid.contactList.volunteers
      : config.sendgrid.contactList.students

    const data = {
      list_ids: [contactListId],
      contacts: [
        {
          first_name: user.firstname,
          last_name: user.lastname,
          email: user.email,
          custom_fields: {
            [customFields.isBanned]: String(user.isBanned),
            [customFields.isTestUser]: String(user.isTestUser),
            [customFields.isVolunteer]: String(user.isVolunteer),
            [customFields.isAdmin]: String(user.isAdmin),
            [customFields.isFakeUser]: String(user.isFakeUser),
            [customFields.isDeactivated]: String(user.isDeactivated),
            [customFields.joined]: user.createdAt
          }
        }
      ]
    }
    return putContact(JSON.stringify(data))
  }
}
