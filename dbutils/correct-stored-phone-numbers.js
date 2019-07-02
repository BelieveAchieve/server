/* This script queries the database collection of users, corrects any phone numbers that
 * are not in the strict 10-digit format ##########, and prints console messages for any
 * phone numbers that are invalid or nonexistent.
 */

var mongoose = require('mongoose')
var async = require('async')
var chalk = require('chalk')

var dbconnect = require('./dbconnect')

var User = require('../models/User')

dbconnect(mongoose, function () {
  // see http://regexlib.com/REDetails.aspx?regexp_id=58
  // modified to ignore trailing/leading whitespace and disallow alphanumeric characters
  const US_PHONE_REGEX = /^\s*(?:[0-9](?: |-)?)?(?:\(?([0-9]{3})\)?|[0-9]{3})(?: |-)?(?:([0-9]{3})(?: |-)?([0-9]{4}))\s*$/

  // regex for the format we want
  const STRICT_PHONE_REGEX = /^[0-9]{10}$/

  async.waterfall([
    function (callback) {
      // query collection of users that have valid phone numbers set
      User.find({
        $and: [ { phone: { $regex: US_PHONE_REGEX } }, { phone: { $not: STRICT_PHONE_REGEX } } ]
      })
        .select('email phone')
        .comment('Search for valid U. S. phone numbers not correctly formatted for twilio')
        .exec(function (err, users) {
          if (err) {
            callback(err)
          } else if (users && users.length) {
            users.forEach(function (user) {
              var oldPhone = user.phone
              user.phonePretty = oldPhone
              user.save(function (err) {
                if (err) {
                  return callback(err)
                } else {
                  console.log(chalk.cyan(`Phone number of user ${user.email} reformatted to ${user.phone} (was ${oldPhone}).`))
                  callback()
                }
              })
            })
          } else {
            console.log('All users with valid phone numbers are formatted correctly.')
            callback()
          }
        })
    },
    function (callback) {
      // report to console any users with invalid phone numbers
      User.find({
        $or: [ { phone: { $not: US_PHONE_REGEX } }, { phone: null } ]
      })
        .select('email phone isVolunteer')
        .comment('Search for invalid U. S. phone numbers')
        .exec(function (err, users) {
          if (err) {
            return callback(err)
          } else if (users && users.length) {
            users.forEach(function (user) {
              if (user.phone) {
                console.error(chalk.yellow(`User ${user.email} has invalid phone number ${user.phone}.`))
              } else if (user.isVolunteer) {
                console.error(chalk.yellow(`Volunteer ${user.email} has not provided a phone number.`))
              }
              callback()
            })
          } else {
            console.log('All users have valid U. S. phone numbers.')
            callback()
          }
        })
    }
  ], function (err) {
    if (err) {
      console.log(err)
    }
    mongoose.disconnect()
  })
})
