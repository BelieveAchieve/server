const mongoose = require('mongoose')

const dbconnect = require('./dbconnect')

const User = require('../models/User')
require('../models/Session')
require('../models/Notification')

dbconnect(mongoose, function() {
  const volunteerQueryMatch = {
    isVolunteer: true,
    isFakeUser: false,
    isTestUser: false,
    isFailsafeVolunteer: false
  }

  const subject = process.argv[2]

  if (subject && subject !== 'all') {
    volunteerQueryMatch[`certifications.${subject}.passed`] = true
  }

  const dayAndTime = process.argv[3]

  if (dayAndTime) {
    volunteerQueryMatch[`availability.${dayAndTime}`] = true
  }

  User.find(volunteerQueryMatch)
    .populate('volunteerLastNotification volunteerLastSession')
    .then(volunteers => {
      const vData = volunteers.sort(
        (v1, v2) => v2.volunteerPointRank - v1.volunteerPointRank
      )

      const volunteerSummary = vData.map(v => ({
        email: v.email,
        points: v.volunteerPointRank,
        joined: v.createdAt,
        partner: v.volunteerPartnerOrg || null,
        lastNotification: v.volunteerLastNotification
          ? v.volunteerLastNotification.sentAt
          : 'none',
        lastSession: v.volunteerLastSession
          ? v.volunteerLastSession.createdAt
          : 'none'
      }))

      const volunteerCsvHeader = Object.keys(volunteerSummary[0]).join(',')
      const volunteerCsvValues = volunteerSummary
        .map(o => Object.values(o).join(','))
        .join('\n')
      const volunteerCsv = volunteerCsvHeader + '\n' + volunteerCsvValues

      console.log('Notification Point Rank CSV:', '\n')
      console.log(volunteerCsv)

      mongoose.disconnect()
    })
    .catch(err => {
      console.log(err)

      mongoose.disconnect()
    })
})
