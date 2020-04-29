const mongoose = require('mongoose')
const { IP_ADDRESS_STATUS } = require('../constants')

const ipAddressSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },

  ip: {
    type: String,
    unique: true,
    required: true
  },

  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  status: {
    type: String,
    enum: [
      IP_ADDRESS_STATUS.OK,
      IP_ADDRESS_STATUS.BANNED
    ],
    default: IP_ADDRESS_STATUS.OK
  },
})

module.exports = mongoose.model('IpAddress', ipAddressSchema)
