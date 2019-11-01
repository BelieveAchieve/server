const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')

const User = require('../models/User')

const certKeys = ['algebra', 'geometry', 'trigonometry', 'precalculus', 'calculus', 'planning', 'essays', 'applications']
const deadCertKeys = ['biology', 'chemistry', 'esl']

dbconnect(mongoose, function () {
  User.find({
    isVolunteer: true,
    certifications: { $exists: false }
  }).then((volunteers) => {
    const volunteerUpdatePromises = volunteers.map(v => {
      const vRawObj = v.toObject()

      const certifications = certKeys.reduce((certs, certKey) => {
        if (vRawObj[certKey]) {
          certs[certKey] = vRawObj[certKey]
        } else {
          certs[certKey] = {
            passed: false,
            tries: 0
          }
        }

        return certs
      }, {})

      console.log(`Migrating volunteer certs for: ${v._id}`)

      // 1. Add new grouped "certifications" property
      v.set('certifications', certifications)

      // 2. Remove old ungrouped certifications
      certKeys.concat(deadCertKeys).forEach(certKey => {
        v.set(certKey, undefined, { strict: false })
      })

      // 3. Save
      return v.save()
    })

    return Promise.all(volunteerUpdatePromises)
  }).catch((err) => {
    if (err) {
      console.log(err)
    }
  }).finally(() => {
    mongoose.disconnect()
  })
})
