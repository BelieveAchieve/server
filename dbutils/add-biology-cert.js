const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

const main = async () => {
  try {
    await dbconnect()
    const biology = {
      passed: false,
      tries: 0
    }
    const result = await User.updateMany(
      { isVolunteer: true },
      { $set: { 'certifications.biology': biology } },
      { strict: false }
    )
    console.log(result)
  } catch (error) {
    console.error(error)
  }

  mongoose.disconnect()
}

main()
