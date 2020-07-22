const passport = require('../auth/passport')
const ReportService = require('../../services/ReportService')

module.exports = function(router) {
  router.get('/reports/session-report', passport.isAdmin, async function(
    req,
    res,
    next
  ) {
    try {
      const sessions = await ReportService.sessionReport(req.query)
      res.json({ sessions })
    } catch (error) {
      next(error)
    }
  })

  router.get('/reports/usage-report', passport.isAdmin, async function(
    req,
    res,
    next
  ) {
    try {
      const students = await ReportService.usageReport(req.query)
      res.json({ students })
    } catch (error) {
      next(error)
    }
  })
}
