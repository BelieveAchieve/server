import FeedbackModel, { Feedback, FeedbackDocument } from '../models/Feedback';

export const getFeedback = (query): Promise<Feedback> => {
  return FeedbackModel.findOne(query)
    .lean()
    .exec();
};

export const saveFeedback = async (data: {
  sessionId: string;
  type: string;
  subTopic: string;
  responseData: string;
  userType: string;
  studentId: string;
  volunteerId: string;
}): Promise<FeedbackDocument> => {
  const feedback = new FeedbackModel(data);
  return feedback.save();
};
