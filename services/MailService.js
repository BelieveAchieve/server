const config = require('../config')
const sgMail = require('@sendgrid/mail')
const axios = require('axios')
const { capitalize } = require('lodash')

sgMail.setApiKey(config.sendgrid.apiKey)

const options = {
  headers: {
    Authorization: `Bearer ${config.sendgrid.apiKey}`,
    'content-type': 'application/json'
  }
}

const putContact = data =>
  axios.put('https://api.sendgrid.com/v3/marketing/contacts', data, options)

const getContact = email =>
  axios.post(
    'https://api.sendgrid.com/v3/marketing/contacts/search',
    { query: `email = '${email}'` },
    options
  )

const sgDeleteContact = contactId =>
  axios.delete(
    `https://api.sendgrid.com/v3/marketing/contacts?ids=${contactId}`,
    options
  )

const SG_CUSTOM_FIELDS = {
  isBanned: 'e3_T',
  isTestUser: 'e4_T',
  isVolunteer: 'e6_T',
  isAdmin: 'e7_T',
  isFakeUser: 'e8_T',
  isDeactivated: 'e9_T',
  joined: 'e10_D',
  studentPartnerOrg: 'e11_T',
  studentPartnerOrgDisplay: 'e12_T',
  volunteerPartnerOrg: 'e13_T',
  volunteerPartnerOrgDisplay: 'e14_T',
  passedUpchieve101: 'e17_T'
}

const sendEmail = (
  toEmail,
  fromEmail,
  fromName,
  templateId,
  dynamicData,
  unsubscribeGroupId,
  callback,
  overrides = {}
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
    asm,
    ...overrides
  }

  return sgMail.send(msg, callback)
}

// @todo: use this in other MailService methods
const buildLink = path => {
  const { host } = config.client
  const protocol = config.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${host}/${path}`
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

  sendContactForm: ({ responseData }, callback) => {
    sendEmail(
      config.mail.receivers.contact,
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

  sendOpenVolunteerWelcomeEmail: ({ email, volunteerName }) => {
    sendEmail(
      email,
      config.mail.senders.support,
      'UPchieve',
      config.sendgrid.openVolunteerWelcomeTemplate,
      { volunteerName },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendPartnerVolunteerWelcomeEmail: ({ email, volunteerName }) => {
    sendEmail(
      email,
      config.mail.senders.support,
      'UPchieve',
      config.sendgrid.partnerVolunteerWelcomeTemplate,
      { volunteerName },
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

  sendReportedSessionAlert: ({
    sessionId,
    reportedByEmail,
    reportReason,
    reportMessage
  }) => {
    const sessionAdminLink = buildLink(`admin/sessions/${sessionId}`)
    return sendEmail(
      config.mail.receivers.staff,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.reportedSessionAlertTemplate,
      {
        sessionId,
        sessionAdminLink,
        reportedByEmail,
        reportReason,
        reportMessage
      },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendReferenceForm: ({ reference, volunteer }) => {
    const emailData = {
      referenceUrl: buildLink(`reference-form/${reference._id}`),
      referenceName: reference.firstName,
      volunteerName: `${volunteer.firstname} ${volunteer.lastname}`
    }

    return sendEmail(
      reference.email,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.referenceFormTemplate,
      emailData,
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendApprovedNotOnboardedEmail: volunteer => {
    return sendEmail(
      volunteer.email,
      config.mail.senders.support,
      'UPchieve',
      config.sendgrid.approvedNotOnboardedTemplate,
      { volunteerName: volunteer.firstname },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendReadyToCoachEmail: volunteer => {
    const readyToCoachTemplate = volunteer.volunteerPartnerOrg
      ? config.sendgrid.partnerReadyToCoachTemplate
      : config.sendgrid.openReadyToCoachTemplate
    return sendEmail(
      volunteer.email,
      config.mail.senders.support,
      'UPchieve',
      readyToCoachTemplate,
      { volunteerName: volunteer.firstname },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendBannedUserAlert: ({ userId, banReason, sessionId }) => {
    const userAdminLink = buildLink(`admin/users/${userId}`)
    const sessionAdminLink = buildLink(`admin/sessions/${sessionId}`)
    return sendEmail(
      config.mail.receivers.staff,
      config.mail.senders.noreply,
      'UPchieve',
      config.sendgrid.bannedUserAlertTemplate,
      {
        userId,
        banReason,
        sessionId,
        userAdminLink,
        sessionAdminLink
      },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendRejectedPhotoSubmission: volunteer => {
    return sendEmail(
      volunteer.email,
      config.mail.senders.support,
      'The UPchieve Team',
      config.sendgrid.rejectedPhotoSubmissionTemplate,
      { firstName: volunteer.firstname },
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendRejectedReference: ({ reference, volunteer }) => {
    const firstName = capitalize(volunteer.firstname)
    const emailData = {
      referenceName: `${capitalize(reference.firstName)} ${capitalize(
        reference.lastName
      )}`,
      firstName
    }

    return sendEmail(
      volunteer.email,
      config.mail.senders.support,
      'The UPchieve Team',
      config.sendgrid.rejectedReferenceTemplate,
      emailData,
      config.sendgrid.unsubscribeGroup.account
    )
  },

  sendReferenceFollowup: ({ reference, volunteer }) => {
    const volunteerFirstName = capitalize(volunteer.firstName)
    const volunteerLastName = capitalize(volunteer.lastName)
    const emailData = {
      referenceUrl: buildLink(`reference-form/${reference._id}`),
      referenceName: reference.firstName,
      volunteerName: `${volunteerFirstName} ${volunteerLastName}`,
      volunteerFirstName
    }
    const overrides = {
      reply_to: {
        email: config.mail.receivers.recruitment
      }
    }

    return sendEmail(
      reference.email,
      config.mail.senders.recruitment,
      'Mark at UPchieve',
      config.sendgrid.referenceFollowupTemplate,
      emailData,
      config.sendgrid.unsubscribeGroup.account,
      null,
      overrides
    )
  },

  sendWaitingOnReferences: volunteer => {
    return sendEmail(
      volunteer.email,
      config.mail.senders.support,
      'The UPchieve Team',
      config.sendgrid.waitingOnReferencesTemplate,
      {
        firstName: capitalize(volunteer.firstname)
      },
      config.sendgrid.unsubscribeGroup.account,
      null
    )
  },

  sendNiceToMeetYou: volunteer => {
    const teamMemberEmail = 'mark.espinoza@upchieve.org'
    const overrides = {
      reply_to: {
        email: teamMemberEmail
      }
    }

    return sendEmail(
      volunteer.email,
      teamMemberEmail,
      'Mark',
      config.sendgrid.niceToMeetYouTemplate,
      {
        firstName: capitalize(volunteer.firstname)
      },
      config.sendgrid.unsubscribeGroup.account,
      null,
      overrides
    )
  },

  sendHourSummaryEmail: ({
    firstName,
    email,
    sentHourSummaryIntroEmail,
    startDate,
    endDate,
    totalCoachingHours,
    totalPassedQuizzes,
    totalElapsedAvailability,
    totalVolunteerHours
  }) => {
    return sendEmail(
      email,
      config.mail.senders.support,
      'UPchieve',
      sentHourSummaryIntroEmail
        ? config.sendgrid.weeklyHourSummaryEmailTemplate
        : config.sendgrid.weeklyHourSummaryIntroEmailTemplate,
      {
        firstName: capitalize(firstName),
        startDate,
        endDate,
        totalCoachingHours,
        totalPassedQuizzes,
        totalElapsedAvailability,
        totalVolunteerHours
      },
      // @todo: change unsubscribe group
      config.sendgrid.unsubscribeGroup.account,
      null
    )
  },

  createContact: async user => {
    const customFields = {
      [SG_CUSTOM_FIELDS.isBanned]: String(user.isBanned),
      [SG_CUSTOM_FIELDS.isTestUser]: String(user.isTestUser),
      [SG_CUSTOM_FIELDS.isVolunteer]: String(user.isVolunteer),
      [SG_CUSTOM_FIELDS.isAdmin]: String(user.isAdmin),
      [SG_CUSTOM_FIELDS.isFakeUser]: String(user.isFakeUser),
      [SG_CUSTOM_FIELDS.isDeactivated]: String(user.isDeactivated),
      [SG_CUSTOM_FIELDS.joined]: user.createdAt
    }

    const contactListId = user.isVolunteer
      ? config.sendgrid.contactList.volunteers
      : config.sendgrid.contactList.students

    if (user.isVolunteer)
      customFields[SG_CUSTOM_FIELDS.passedUpchieve101] = String(
        user.certifications.upchieve101.passed
      )

    if (user.volunteerPartnerOrg) {
      customFields[SG_CUSTOM_FIELDS.volunteerPartnerOrg] =
        user.volunteerPartnerOrg
      customFields[SG_CUSTOM_FIELDS.volunteerPartnerOrgDisplay] =
        config.volunteerPartnerManifests[user.volunteerPartnerOrg].name
    }

    if (user.studentPartnerOrg) {
      customFields[SG_CUSTOM_FIELDS.studentPartnerOrg] = user.studentPartnerOrg
      customFields[SG_CUSTOM_FIELDS.studentPartnerOrgDisplay] =
        config.studentPartnerManifests[user.studentPartnerOrg].name
    }

    const data = {
      list_ids: [contactListId],
      contacts: [
        {
          first_name: user.firstname,
          last_name: user.lastname,
          email: user.email,
          custom_fields: customFields
        }
      ]
    }
    return putContact(JSON.stringify(data))
  },

  searchContact: async email => {
    const response = await getContact(email)
    const {
      data: { result }
    } = response
    const [contact] = result
    return contact
  },

  deleteContact: contactId => {
    return sgDeleteContact(contactId)
  }
}
