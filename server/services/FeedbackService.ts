import FeedbackModel, { Feedback, FeedbackDocument } from '../models/Feedback'
import SessionService from './SessionService'

export const getFeedback = (query): Promise<Feedback> => {
  return FeedbackModel.findOne(query)
    .lean()
    .exec()
}

export const saveFeedback = async (data: {
  sessionId: string
  type: string
  subTopic: string
  responseData: { [key: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  userType: string
  studentId: string
  volunteerId: string
}): Promise<FeedbackDocument> => {
  const feedback = new FeedbackModel(data)
  const { sessionId, responseData } = data
  const flags = await SessionService.getFeedbackFlags(responseData)
  if (flags.length > 0)
    await SessionService.addFeedbackFlags({
      sessionId,
      flags
    })
  return feedback.save()
}
