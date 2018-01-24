var twilio = require('../../services/twilioNotification');

module.exports = function(router) {
//	console.log('Twilio Loaded');

	router.post('/session/math/*',function(){
		twilio.notifyOnSession();

	});
};