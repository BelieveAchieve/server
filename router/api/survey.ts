import * as SurveyService from '../../services/SurveyService';

module.exports = function(router) {
  router.post('/survey/presession/:sessionId', async (req, res, next) => {
    const { user } = req;
    const { sessionId } = req.params;
    const { responseData } = req.body;
    try {
      await SurveyService.savePresessionSurvey({
        user,
        sessionId,
        responseData
      });
      res.status(200);
    } catch (error) {
      next(error);
    }
  });

  router.get('/survey/presession/:sessionId', async (req, res, next) => {
    const { user } = req;
    const { sessionId } = req.params;

    try {
      const survey = await SurveyService.getPresessionSurvey({
        user,
        session: sessionId
      });
      res.json({ survey });
    } catch (error) {
      next(error);
    }
  });
};
