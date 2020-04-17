const config = require('../config.js')

function blockBlacklistedIps(req, res, next) {
  const ipBlacklist = config.ipBlacklist
  const userIp = req.ip

  // Remove subnet prefix if present
  const noPrefixUserIp =
    userIp.indexOf('::ffff:') === 0 ? userIp.slice(7) : userIp

  // Check blacklist for user's IP with and without subnet prefix
  const isBlacklisted =
    ipBlacklist.indexOf(userIp) !== -1 ||
    ipBlacklist.indexOf(noPrefixUserIp) !== -1

  if (isBlacklisted) {
    return res.status(403).json({
      err: 'Forbidden'
    })
  }

  return next()
}

module.exports = blockBlacklistedIps
