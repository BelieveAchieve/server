// const ReportService = require('../../services/ReportService')
// var passport = require('../auth/passport')
const passport = require('../auth/passport');
const ReportService = require('../../services/ReportService');

module.exports = function(router) {
  router.get('/reports/session-report', passport.isAdmin, async function(
    req,
    res
  ) {
    try {
      const sessions = await ReportService.sessionReport(req.query)
      res.json({ sessions })
    } catch (error) {
      res.sendStatus(500)
    }
  });

  router.get('/reports/usage-report', passport.isAdmin, async function(
    req,
    res
  ) {
    try {
      const students = await ReportService.usageReport(req.query)
      res.json({ students })
    } catch (error) {
      res.sendStatus(500)
    }
  });
};
