var UserCtrl = require('../../controllers/UserCtrl')

module.exports = function (router) {
  router.route('/user').get(function (req, res) {
    if (!req.user) {
      return res.json({
        err: 'Client has no authenticated session'
      })
    }

    // Return student user
    if (!req.user.isVolunteer) {
      return res.json({
        user: req.user.parseProfile()
      })
    }

    // Return volunteer user
    req.user.populateForVolunteerStats().execPopulate().then(populatedUser => {
      return res.json({
        user: populatedUser.parseProfile()
      })
    })
  })

  router.put('/user', function (req, res, next) {
    var data = req.body || {}
    UserCtrl.update(
      {
        userId: req.user._id,
        data: {
          firstname: data.firstname,
          lastname: data.lastname,
          nickname: data.nickname,
          picture: data.picture,
          birthdate: data.birthdate,
          serviceInterests: data.serviceInterests,
          gender: data.gender,
          race: data.race,
          groupIdentification: data.groupIdentification,
          computerAccess: data.computerAccess,
          preferredTimes: data.preferredTimes,
          phone: data.phone,
          phonePretty: data.phonePretty,
          currentGrade: data.currentGrade,
          expectedGraduation: data.expectedGraduation,
          difficultAcademicSubject: data.difficultAcademicSubject,
          difficultCollegeProcess: data.difficultCollegeProcess,
          highestLevelEducation: data.highestLevelEducation,
          hasGuidanceCounselor: data.hasGuidanceCounselor,
          gpa: data.gpa,
          college: data.college,
          collegeApplicationsText: data.collegeApplicationsText,
          commonCollegeDocs: data.commonCollegeDocs,
          academicInterestsText: data.academicInterestsText,
          testScoresText: data.testScoresText,
          advancedCoursesText: data.advancedCoursesText,
          favoriteAcademicSubject: data.favoriteAcademicSubject,
          extracurricularActivitesText: data.extracurricularActivitesText,
          heardFrom: data.heardFrom,
          referred: data.referred,
          pastSessions: data.pastSessions
        }
      },
      function (err, parsedUser) {
        if (err) {
          next(err)
        } else {
          res.json({
            user: parsedUser
          })
        }
      }
    )
  })
}
