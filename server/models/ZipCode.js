const mongoose = require('mongoose')

const MEDIUM_INCOME_THRESHOLD = 60000

const zipCodeSchema = new mongoose.Schema({
  zipCode: {
    type: String,
    unique: true,
    required: true
  },
  medianIncome: Number
})

zipCodeSchema.virtual('isEligible').get(function() {
  if (!this.medianIncome) return true

  return this.medianIncome < MEDIUM_INCOME_THRESHOLD
})

zipCodeSchema.statics.findByZipCode = function(zipCode, cb) {
  return this.findOne({ zipCode }, cb)
}

module.exports = mongoose.model('ZipCode', zipCodeSchema)
