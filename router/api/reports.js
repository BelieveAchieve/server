// const ReportService = require('../../services/ReportService')
// var passport = require('../auth/passport')
const passport = require('../auth/passport');
const ReportService = require('../../services/ReportService');

module.exports = function(router) {
  router.get('/reports/session-report', passport.isAdmin, async function(
    req,
    res,
    next
  ) {
    try {
      const sessions = await ReportService.getSessionReport
      res.json({ sessions })
    } catch (error) {
      res.sendStatus(500)
    }
  });
};
