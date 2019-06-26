var config = require('../config')
const sgMail = require('@sendgrid/mail')
// Utility functions for sendgrid

var sendEmail = function(apiKey, toEmail, fromEmail, templateId, dynamicData, callback) {
  sgMail.setApiKey(apiKey)
  console.log(apiKey)
  const msg = {
      to: toEmail,
      from:fromEmail ,
      templateId: templateId,
      dynamic_template_data: dynamicData
  }
  console.log(msg)
  sgMail.send(msg,callback)
  console.log('hello')
}

module.exports = {
  sendVerification: function (options, callback) {
    var email = options.email
    var token = options.token
    var url = 'http://' + config.client.host + '/#/action/verify/' + token
    console.log(url)
    sendEmail(config.sendgrid.apiKey,email,config.mail.senders.noreply, 
      config.sendgrid.verifyTemplate, {
        'userEmail': email,
        'verifyLink': url
      }, callback)
  },
  sendContactForm: function (options, callback) {
    var email = options.email
    var responseData = options.responseData
    console.log(responseData)
    sendEmail(config.sendgrid.apiKey,email,config.mail.senders.noreply, 
      config.sendgrid.contactTemplate, responseData, callback)
  },
  sendReset: function (options, callback) {
    var email = options.email
    var token = options.token
    var url = 'http://' + config.client.host + '/#/setpassword/' + token
    console.log(url)
    sendEmail(config.sendgrid.apiKey,email,config.mail.senders.noreply, 
      config.sendgrid.resetTemplate, {
        'userEmail': email,
        'resetLink': url
      }, callback)
  }
}
