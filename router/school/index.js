const express = require('express')
const passport = require('../auth/passport')

const SchoolCtrl = require('../../controllers/SchoolCtrl')
const School = require('../../models/School')

module.exports = function(app) {
  const router = new express.Router()

  router.route('/search').get(function(req, res, next) {
    const q = req.query.q

    SchoolCtrl.search(q, function(err, results) {
      if (err) {
        next(err)
      } else {
        res.json({
          results: results
        })
      }
    })
  })

  // route to add an email to the list for notifying when approved
  router.route('/approvalnotify').post(function(req, res, next) {
    const schoolUpchieveId = req.body.schoolUpchieveId

    const email = req.body.email

    School.findOneAndUpdate(
      { upchieveId: schoolUpchieveId },
      { $push: { approvalNotifyEmails: { email } } },
      { runValidators: true },
      function(err, school) {
        if (err) {
          next(err)
        } else {
          res.json({
            schoolId: school.upchieveId
          })
        }
      }
    )
  })

  // Check if a school is approved
  router.route('/check').post(function(req, res, next) {
    const schoolUpchieveId = req.body.schoolUpchieveId

    School.findByUpchieveId(schoolUpchieveId, function(err, school) {
      if (err) {
        next(err)
      } else {
        res.json({ approved: school.isApproved })
      }
    })
  })

  // List all students registered with a school (admins only)
  router
    .route('/studentusers/:schoolUpchieveId')
    .all(passport.isAdmin)
    .get(function(req, res, next) {
      const upchieveId = req.params.schoolUpchieveId

      School.findByUpchieveId(upchieveId)
        .populate('studentUsers')
        .exec(function(err, school) {
          if (err) {
            next(err)
          } else {
            res.json({
              upchieveId: school.upchieveId,
              studentUsers: school.studentUsers.map(user => {
                return {
                  email: user.email,
                  firstname: user.firstname,
                  lastname: user.lastname,
                  userId: user._id
                }
              })
            })
          }
        })
    })

  app.use('/school', router)
}
