const mongoose = require('mongoose')

const ineligibleStudentSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  zipCode: String,
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  ipAddress: String,
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false
  },
})

module.exports = mongoose.model('IneligibleStudent', ineligibleStudentSchema)
