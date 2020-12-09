import FeedbackModel, { Feedback, FeedbackDocument } from '../models/Feedback';
import StatsService from './StatsService';
import SessionService from './SessionService';

export const getFeedback = (query): Promise<Feedback> => {
  return FeedbackModel.findOne(query)
    .lean()
    .exec();
};

export const saveFeedback = async (data: {
  sessionId: string;
  type: string;
  subTopic: string;
  responseData: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  userType: string;
  studentId: string;
  volunteerId: string;
}): Promise<FeedbackDocument> => {
  const feedback = new FeedbackModel(data);
  const { sessionId, responseData } = data;
  const flags = await SessionService.getFeedbackFlags(responseData);
  if (flags.length > 0)
    await SessionService.addFeedbackFlags({
      sessionId,
      flags
    });
  const rating =
    feedback.responseData &&
    feedback.responseData['rate-session'] &&
    feedback.responseData['rate-session'].rating;
  if (rating) {
    const dimensions = {
      topic: feedback.topic,
      'sub-topic': feedback.subTopic
    };
    // FIXME this needs studentPartnerOrg / volunteerPartnerOrg for segmentSlugs.
    // it's stored on User model for both student and volunteer, so needs another 1-2 queries...
    const segmentSlugs = [];
    StatsService.increment(
      data.studentId ? 'session-rating' : 'volunteer-rating',
      dimensions,
      { count: rating, segmentSlugs }
    );
    StatsService.increment(
      data.studentId ? 'session-ratings' : 'volunteer-ratings',
      dimensions,
      { segmentSlugs }
    );
  }
  return feedback.save();
};
