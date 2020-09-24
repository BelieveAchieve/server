import * as SurveyService from '../../services/SurveyService';

module.exports = function(router) {
  router.post('/survey/presession', async (req, res, next) => {
    const { user } = req;
    const {
      sessionId,
      responseData
    } = req.body;
    try {
      await SurveyService.savePresessionSurvey({
        sessionId,
        responseData,
        user
      });
      res.status(200);
    } catch (error) {
      next(error);
    }
  });
};
