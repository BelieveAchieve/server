var config = require('../config')
var helper = require('sendgrid').mail
var sendgrid = require('sendgrid')(config.sendgrid.apiKey)

// Utility functions for sendgrid

var getMailHelper = function (options) {
  options = options || {}
  var fromEmail = new helper.Email(options.from || config.mail.senders.noreply)
  var toEmail = new helper.Email(options.to)
  var subject = options.subject || '[UPchieve] New message'
  var content = new helper.Content('text/html', options.content || '<p></p>')
  var mail = new helper.Mail(fromEmail,subject,toEmail, content)
    
  return mail
}

var getTemplateMailHelper = function (mail, id, substitutions) {
  var templatedMail = mail
  templatedMail.setTemplateId(id)
  
  Object.keys(substitutions).forEach(function (subKey) {
    var subHelper = new helper.Substitution(subKey, substitutions[subKey])
    templatedMail.personalizations[0].addSubstitution(subHelper)
  })
  
  return templatedMail
}

var sendEmail = function (mail, callback) {
  var request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  })

  sendgrid.API(request, function (err, res) {
    if (err) {
      console.log('Sendgrid error')
      if (err.response) {
        console.log(err.response.body)
      } else {
        console.log(err)
      }
    }
    callback(err, res)
  })
}

module.exports = {
  sendVerification: function (options, callback) {
    var email = options.email
    var token = options.token
    var url = 'http://' + config.client.host + '/#/action/verify/' + token
    console.log(url)

    var mail = getMailHelper({
      to: email,
      subject: '[UPchieve] Verify your email address'
    })

    var templatedMail = getTemplateMailHelper(
      mail,
      config.sendgrid.templateId,
      {
        '-userEmail-': email,
        '-verifyLink-': url
      }
    )
    sendEmail(templatedMail, callback)
  },
  sendContactForm: function (options, callback) {
    var email = options.email
    var responseData = options.responseData
    var from = responseData['email']
    var subject = responseData['subject']
    var more = responseData['more']

    var subjects = Object.keys(subject)
    for (var i = 0; i < subjects.length; i++) {
        if (subjects[i] == "Other") {
            subjects[i] += ': ' + subject['Other']
        }
    }
    var topics = ''
    for (var i = 0; i < subjects.length; i++) {
        topics += '<li>' + subjects[i] + '</li>'
    }

    var emailContent = [
        '<h3> FROM: ' + from + '</h3>',
        '<h3> TOPICS: </h3>',
        topics,
        '<h3>ADDITIONAL INFORMATION: </h3>',
        '<p>' + more + '</p>',
      ].join('\n\n')

    var mail = getMailHelper({
      to: email,
      subject: 'Contact Form: ' + subjects ,
      content: emailContent,
    })

    sendEmail(mail, callback)
  },
  sendReset: function (options, callback) {
    var email = options.email
    var token = options.token
    var url = 'http://' + config.client.host + '/#/setpassword/' + token

    var emailContent = [
      'Click on this link to choose a new password!',
      url,
      'If you received this email by accident, you can just ignore it and your password will not change.'
    ].join('\n\n')

    var mail = getMailHelper({
      to: email,
      subject: '[UPchieve] Did you want to reset your password?',
      content: emailContent
    })
    sendEmail(mail, callback)
  }
}
