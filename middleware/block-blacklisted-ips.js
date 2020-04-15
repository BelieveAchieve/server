const config = require('../config.js')

function blockBlacklistedIps(req, res, next) {
  const ipBlacklist = config.ipBlacklist
  const userIp = req.ip

  const isBlacklisted = ipBlacklist.indexOf(userIp) !== -1

  if (isBlacklisted) {
    return res.status(403).json({
      err: 'Forbidden'
    })
  }

  return next()
}

module.exports = blockBlacklistedIps
