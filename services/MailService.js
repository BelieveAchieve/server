const config = require('../config')
const sgMail = require('@sendgrid/mail')

const sendEmail = function (apiKey, toEmail, fromEmail, templateId, dynamicData, callback) {
  sgMail.setApiKey(apiKey)

  const msg = {
    to: toEmail,
    from: fromEmail,
    templateId: templateId,
    dynamic_template_data: dynamicData
  }

  sgMail.send(msg, callback)
}

module.exports = {
  sendVerification: function (options, callback) {
    const email = options.email
    const token = options.token
    const url = 'http://' + config.client.host + '/action/verify/' + token

    sendEmail(config.sendgrid.apiKey, email, config.mail.senders.noreply,
      config.sendgrid.verifyTemplate, {
        'userEmail': email,
        'verifyLink': url
      }, callback)
  },

  sendContactForm: function (options, callback) {
    const email = options.email
    const responseData = options.responseData

    sendEmail(config.sendgrid.apiKey, email, config.mail.senders.noreply,
      config.sendgrid.contactTemplate, responseData, callback)
  },

  sendReset: function (options, callback) {
    const email = options.email
    const token = options.token
    const url = 'http://' + config.client.host + '/setpassword/' + token

    sendEmail(config.sendgrid.apiKey, email, config.mail.senders.noreply,
      config.sendgrid.resetTemplate, {
        'userEmail': email,
        'resetLink': url
      }, callback)
  }
}
