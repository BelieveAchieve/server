/* This script queries the database collection of sessions and users. First it
 * adds the field pastSessions to any users that don't have it. Then it goes
 * through all sessions and adds it to the users if not already added
 */

var mongoose = require('mongoose')
var async = require('async')

var dbconnect = require('./dbconnect')

var User = require('../models/User')
var Session = require('../models/Session')

function addSession (user, session) {
  // pushes the session on to the users pastSessions array only if new session
  User.update({ _id: user._id },
    { $addToSet: { pastSessions: session._id } },
    function (err, results) {
      if (err) {
        throw err
      } else {
        // print out what session was added to which user
        if (results.nModified === 1) {
          console.log(`${session._id} session was added to ` +
          `${user._id}'s pastSessions`)
        }
      }
    })
}

dbconnect(mongoose, function () {
  async.waterfall([
    function (callback) {
      // finds users that don't have pastSessions and initializes as an array
      User.update(
        { pastSessions: { $exists: false } },
        { $set: { pastSessions: [] } },
        { upsert: false, multi: true }
      )
      callback()
    },
    function (callback) {
      // query collection of sessions
      Session.find({}, function (err, sessions) {
        if (err) {
          callback(err)
        } else {
          // add session to the student and volunteer's pastSessions
          for (var i = 0; i < sessions.length; i++) {
            var volunteer = sessions[i].volunteer
            var student = sessions[i].student

            // if student exists, add to their sessions
            if (student) {
              addSession(student, sessions[i])
            }

            // if volunteer exists, add to their sessions
            if (volunteer) {
              addSession(volunteer, sessions[i])
            }
          }
          callback()
        }
      })
    },
    function (callback) {
      // query collection of users and print out their pastSessions
      User.find({}, { pastSessions: 1 }, function (err, users) {
        if (err) {
          throw err
        } else {
          console.log(users)
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
