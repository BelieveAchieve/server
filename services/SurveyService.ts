import SurveyModel, { Survey, SurveyDocument } from '../models/Survey';
import { User } from '../models/types';
import { SURVEY_TYPES } from '../constants';

export const savePresessionSurvey = async (data: {
  user: User;
  sessionId: string;
  responseData: object;
}): Promise<SurveyDocument> => {
  const survey = new SurveyModel({
    session: data.sessionId,
    user: data.user._id,
    surveyType: SURVEY_TYPES.STUDENT_PRESESSION,
    responseData: data.responseData
  });
  return survey.save();
};
