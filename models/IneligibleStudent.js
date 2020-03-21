const mongoose = require('mongoose')

const ineligibleStudentSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  zipCode: String,
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  ipAddress: String
})

module.exports = mongoose.model('IneligibleStudent', ineligibleStudentSchema)
