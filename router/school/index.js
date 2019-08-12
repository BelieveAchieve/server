const express = require('express')

const SchoolCtrl = require('../../controllers/SchoolCtrl')
const School = require('../../models/School')

module.exports = function (app) {
  const router = express.Router()

  router.route('/search').get(function (req, res) {
    const q = req.query.q

    SchoolCtrl.search(q, function (err, results) {
      if (err) {
        res.json({
          err: err
        })
      } else {
        res.json({
          results: results
        })
      }
    })
  })

  // route to add an email to the list for notifying when approved
  router.route('/approvalnotify').post(function (req, res) {
    const schoolUpchieveId = req.body.schoolUpchieveId

    const email = req.body.email

    School.updateOne({ upchieveId: schoolUpchieveId },
      { $push: { approvalNotifyEmails: email } },
      function (err, school) {
        if (err) {
          res.json({
            err: err
          })
        } else {
          res.json({
            schoolId: school.upchieveId
          })
        }
      })
  })
}
