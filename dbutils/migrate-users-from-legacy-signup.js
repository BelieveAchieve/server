/* Sets User objects that were created by the legacy signup process
 * to point to the Legacy Signup High School created in
 * import-nces-highschools.js
 */

const mongoose = require('mongoose')
const async = require('async')
const cliProgress = require('cli-progress')

const dbconnect = require('./dbconnect')

const User = require('../models/User')
const School = require('../models/School')

dbconnect(mongoose, function () {
  async.waterfall([
    function (done) {
      User.find({
        isVolunteer: false,
        highschool: { $exists: true },
        approvedHighschool: { $exists: false }
      }, done)
    },
    function (users, done) {
      School.findByUpchieveId('00000000',
        (err, legacySchool) => {
          if (err) {
            done(err)
          } else if (!legacySchool) {
            done('No school found with upchieveId 00000000: ' +
              'did you run import-nces-highschools.js first?')
          } else {
            done(null, users, legacySchool)
          }
        })
    },
    function (users, legacySchool, done) {
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

      progressBar.start(users.length, 0)

      async.eachLimit(users, 4, function (user, callback) {
        user.approvedHighschool = legacySchool
        user.save((err) => {
          if (!err) {
            progressBar.increment()
          }
          callback(err)
        })
      }, (err) => {
        progressBar.stop()
        done(err)
      })
    }
  ], (err) => {
    if (err) {
      console.log(err)
    }
    mongoose.disconnect()
  })
})
