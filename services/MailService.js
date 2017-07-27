var config = require('../config');
var helper = require('sendgrid').mail
var sendgrid = require('sendgrid')(config.sendgrid.apiKey);


// Utility functions for sendgrid

var getMailHelper = function(options){
  options = options || {};

  var fromEmail = new helper.Email(options.from || config.mail.senders.noreply),
      toEmail = new helper.Email(options.to),
      subject = options.subject || '[UPchieve] New message',
      content = new helper.Content('text/plain', options.content || '<p></p>');

  return new helper.Mail(fromEmail, subject, toEmail, content);
};

var getTemplateMailHelper = function(mail, id, substitutions) {
  var templatedMail = mail;

  templatedMail.setTemplateId(id);
  Object.keys(substitutions).forEach(function(subKey){
    var subHelper = new helper.Substitution(subKey, substitutions[subKey]);
    templatedMail.personalizations[0].addSubstitution(subHelper);
  });

  return templatedMail;
};

var sendEmail = function(mail, callback) {
  console.log(mail.toJSON());
  var request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sendgrid.API(request, function(err, res){
    if (err){
      console.log('Sendgrid error');
      if (err.response){
        console.log(err.response.body);
      } else {
        console.log(err);
      }
    }
    callback(err, res);
  });
};

module.exports = {
  sendVerification: function(options, callback){
    var email = options.email,
        token = options.token;

    var url = 'http://' + config.client.host + '/#/action/verify/' + token;

  	var mail = getMailHelper({
      to: email,
      subject: '[UPchieve] Verify your email address'
    });

    var templatedMail = getTemplateMailHelper(mail, config.sendgrid.verifyTemplateId, {
      '-userEmail-': email,
      '-verifyLink-': url
    });
    sendEmail(templatedMail, callback);
  },

  sendReset: function(options, callback){
    var email = options.email,
        token = options.token;

    var url = 'http://' + config.client.host + '/#/setpassword/' + token;

    var emailContent = [
      'Click on this link to choose a new password!', url,
      'If you received this email by accident, you can just ignore it and your password will not change.',
    ].join('\n\n');

    var mail = getMailHelper({
      to: email,
      subject: '[UPchieve] Did you want to reset your password?',
      content: emailContent
    });
    sendEmail(mail, callback);
  }

};
