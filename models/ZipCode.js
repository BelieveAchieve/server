const mongoose = require('mongoose')

const zipCodeSchema = new mongoose.Schema({
  zipCode: {
    type: String,
    unique: true,
    required: true
  },
  medianIncome: Number
})

zipCodeSchema.statics.findByZipCode = function(zipCode, cb) {
  return this.findOne({ zipCode }, cb)
}

module.exports = mongoose.model('ZipCode', zipCodeSchema)
