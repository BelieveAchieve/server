var twilioClient = require('../twilioClient');
var fs = require('fs');
console.log('tse');
function formatMessage(user,type,tutor) {
	return 'Hello, ' + tutor + 'there is a ' + type + 'session available with ' + user + 'now!';
}


exports.notifyOnSession = function() {
//Add in the for each part
	var messageToSend = formatMessage('A', 'B', 'C');
	twilioClient.sendSms('+16109963270',messageToSend);

	//next();

};

//twilioClient.sendSms('+16109963270','test');