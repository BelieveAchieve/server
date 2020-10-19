const axios = require('axios')
const Sentry = require('@sentry/node')
const IpAddress = require('../models/IpAddress')
const User = require('../models/User')
const { IP_ADDRESS_STATUS, USER_BAN_REASON } = require('../constants')
const MailService = require('./MailService')

const cleanIpString = rawIpString => {
  // Remove ipv6 prefix if present
  const ipString =
    rawIpString.indexOf('::ffff:') === 0 ? rawIpString.slice(7) : rawIpString
  return ipString
}

const getIpWhoIs = async rawIpString => {
  const ipString = cleanIpString(rawIpString)

  try {
    const { data } = await axios.get(
      `http://free.ipwhois.io/json/${ipString}`,
      {
        timeout: 1500
      }
    )
    return data
  } catch (err) {
    Sentry.captureException(err)
    return {}
  }
}

const findOrCreateIpAddress = async rawIpString => {
  const ipString = cleanIpString(rawIpString)
  const existingIpAddress = await IpAddress.findOne({ ip: ipString })
    .lean()
    .exec()

  if (existingIpAddress) return existingIpAddress

  const newIpAddress = await new IpAddress({ ip: ipString }).save()
  return newIpAddress
}

module.exports = {
  getIpWhoIs,

  record: async ({ user, ipString }) => {
    const userIpAddress = await findOrCreateIpAddress(ipString)
    const alreadyRecorded = userIpAddress.users.some(u => u.equals(user._id))

    if (!alreadyRecorded) {
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { ipAddresses: userIpAddress._id } }
      )
      await IpAddress.updateOne(
        { _id: userIpAddress._id },
        { $addToSet: { users: user._id } }
      )
    }

    return userIpAddress
  },

  ban: async ({ user, ipAddress }) => {
    let didBanUser = false

    // Ban IP if it has only one user listed and user is banned
    if (
      user.isBanned &&
      ipAddress.status === IP_ADDRESS_STATUS.OK &&
      ipAddress.users.length === 1
    )
      await IpAddress.updateOne(
        { _id: ipAddress._id },
        { $set: { status: IP_ADDRESS_STATUS.BANNED } }
      )

    // Ban user if IP banned
    if (ipAddress.status === IP_ADDRESS_STATUS.BANNED && !user.isBanned) {
      didBanUser = true
      const updatedUser = Object.assign(user, { isBanned: true })
      // Update user in the SendGrid contact list with banned status
      MailService.createContact(updatedUser)
      MailService.sendBannedUserAlert({
        userId: user._id,
        banReason: USER_BAN_REASON.BANNED_IP
      })
      await User.updateOne(
        { _id: user._id },
        { $set: { isBanned: true, banReason: USER_BAN_REASON.BANNED_IP } }
      )
    }

    return didBanUser
  },

  unbanUserIps: async user => {
    await IpAddress.updateMany(
      { users: user._id },
      { status: IP_ADDRESS_STATUS.OK }
    )
  }
}
