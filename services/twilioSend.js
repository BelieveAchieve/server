		// Twilio Credentials
		var mongoose = require('mongoose')
		var config = require('../config.js')
		var User = require('../models/User')
		
		module.exports  = {

		notify: function(type){
		
		//Time check
		var date = new Date()
		var day = date.getDay();
		var hour = date.getHours();
		var min = date.getMinutes()/60
		if(min >= .5){
			hour++;
		}
		if(hour > 12){
			hour = `${hour - 12}p`
		}
		else {
			hour = `${hour}a`
		}
		var days = ['Sunday', 'Monday', 'Tuesday','Wednesday','Thursday','Friday','Saturday']
		var type = 'Math';
		var time = `${hour-12}-${hour -11}`;
		var avail = `availability.${days[day]}.${hour}`;

		
		//Connection variables
		var connection = mongoose.connect(config.database);
		var query = User.find({'serviceInterests': type,
								[avail]: 'true'
		})



		query.exec(function (err, person) {
			if (err) return handleError (err);
				var n = -1;
				while (n < person.length-1) {
					n++;
					var pnumb = person[n].phone;
					var name = person[n].firstname;
					send(pnumb,name);
				};
				})
		
		
		function send(pnumb,name){
		const accountSid = config.accountSid;
		const authToken = config.authToken;

		// require the Twilio module and create a REST client
		const client = require('twilio')(accountSid, authToken);
		var pnumb = '+1' + pnumb
		client.messages
			.create({
				to: pnumb,
				from: config.sendingNumber,
				body: `Hi ${name}, A student is waiting for help in ${type} at app.upchieve.org`,
			})
			.then(message => console.log(`Message sent to ${pnumb} with message id \n` + message.sid));  		
		
		}
	}
}