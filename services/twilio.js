// Twilio Credentials
var mongoose = require('mongoose')
var config = require('../config.js')
var User = require('../models/User')
var twilio = require('twilio')
const client = twilio(config.accountSid,config.authToken)

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
		var time = `${hour-12}-${hour -11}`;
		var avail = `availability.${days[day]}.${hour}`;


		//Connection variables
		var query = User.find({'serviceInterests': type,
								[avail]: 'true'
		})

		query.exec(function (err, persons) {
			if (err){
				console.log('Error conducting query: ' + err);
			}
			for(var i =0; i< Math.min(persons.length,3);i++){
				var phoneNumber = persons[i].phone;
				var name = persons[i].firstname;
				if (phoneNumber != undefined) {
					send(phoneNumber,name);
				}
				};
				})


		function send(phoneNumber,name){
		// require the Twilio module and create a REST client
		var phoneNumber = '+1' + phoneNumber
		client.messages.create({
				to: phoneNumber,
				from: config.sendingNumber,
				body: `Hi ${name}, A student is waiting for help in ${type} at app.upchieve.org`,
			})
			.then(message => console.log(`Message sent to ${phoneNumber} with message id \n` + message.sid));  		

		}
//	}
//}