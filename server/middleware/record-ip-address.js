const IpAddressService = require('../services/IpAddressService')
const Sentry = require('@sentry/node')

const recordIpAddress = async (req, res, next) => {
  const { user, ip: ipString } = req

  try {
    const ipAddress = await IpAddressService.record({ user, ipString })
    const didBanUser = await IpAddressService.ban({ user, ipAddress })
    if (didBanUser) req.user.isBanned = true
  } catch (error) {
    Sentry.captureException(error)
  }

  next()
}

module.exports = recordIpAddress
