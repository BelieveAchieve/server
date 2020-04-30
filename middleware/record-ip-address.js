const IpAddressService = require('../services/IpAddressService')
const Sentry = require('@sentry/node')

const recordIpAddress = async (req, res, next) => {
  const { user, ip } = req

  try {
    await IpAddressService.record(user, ip)
  } catch (error) {
    Sentry.captureException(error)
  }

  next()
}

module.exports = recordIpAddress
