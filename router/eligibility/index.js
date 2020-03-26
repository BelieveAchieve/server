const express = require('express')
const passport = require('../auth/passport')

const SchoolCtrl = require('../../controllers/SchoolCtrl')
const School = require('../../models/School')
const ZipCode = require('../../models/ZipCode')
const IneligibleStudent = require('../../models/IneligibleStudent')

module.exports = function(app) {
  const router = new express.Router()

  // Check if a student is eligible
  router.route('/check').post(function(req, res, next) {
    const schoolUpchieveId = req.body.schoolUpchieveId
    const zipCodeInput = req.body.zipCode

    const schoolFetch = School.findByUpchieveId(schoolUpchieveId).exec()
    const zipCodeFetch = ZipCode.findByZipCode(zipCodeInput).exec()

    Promise.all([schoolFetch, zipCodeFetch])
      .then(([school, zipCode]) => {
        const isSchoolApproved = school.isApproved
        const isZipCodeEligible = zipCode && zipCode.isEligible
        const isStudentEligible = isSchoolApproved || isZipCodeEligible

        if (!isStudentEligible) {
          const newIneligibleStudent = new IneligibleStudent({
            zipCode: zipCodeInput,
            school: school._id,
            ipAddress: req.ip
          })

          newIneligibleStudent.save()
        }

        return res.json({ isEligible: isStudentEligible })
      })
      .catch(err => {
        next(err)
      })
  })

  router.route('/school/search').get(function(req, res, next) {
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
  router.route('/school/approvalnotify').post(function(req, res, next) {
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

  // Paginate eligible high schools (admins only)
  router
    .route('/school/findeligible')
    .all(passport.isAdmin)
    .get(function(req, res, next) {
      School.find(
        {
          isApproved: true
        },
        null,
        {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip)
        }
      )
        .exec()
        .then(eligibleSchools => {
          res.json({ eligibleSchools })
        })
        .catch(err => next(err))
    })

  // List all students registered with a school (admins only)
  router
    .route('/school/studentusers/:schoolUpchieveId')
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

  app.use('/eligibility', router)
}
