const IpAddress = require('../models/IpAddress')
const User = require('../models/User')
const { IP_ADDRESS_STATUS } = require('../constants')

const findOrCreateIpAddress = async ipString => {
  const existingIpAddress = await IpAddress.findOne({ ip: ipString })
    .lean()
    .exec()

  if (existingIpAddress) return existingIpAddress

  const newIpAddress = await new IpAddress({ ip: ipString }).save()
  return newIpAddress
}

module.exports = {
  record: async (user, ipString) => {
    const userIpAddress = await findOrCreateIpAddress(ipString)

    // Ban IP if user banned
    if (user.isBanned && IpAddress.status === IP_ADDRESS_STATUS.OK)
      await IpAddress.updateOne(
        { _id: ipAddress._id },
        { $set: IP_ADDRESS_STATUS.BANNED }
      )

    // Ban user if IP banned
    if (userIpAddress.status === IP_ADDRESS_STATUS.BANNED && !user.isBanned)
      await User.updateOne({ _id: user._id }, { $set: { isBanned: true } })

    const alreadyRecorded = userIpAddress.users.some(u => u.equals(user._id))
    if (alreadyRecorded) return

    await User.updateOne(
      { _id: user._id },
      { $addToSet: { ipAddresses: userIpAddress._id } }
    )
    await IpAddress.updateOne(
      { _id: userIpAddress._id },
      { $addToSet: { users: user._id } }
    )
  }
}
