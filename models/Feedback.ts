import { Document, model, Schema, Types } from 'mongoose';

export interface Feedback {
  _id: Types.ObjectId;
  sessionId: string;
  type: string;
  subTopic: string;
  responseData: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  userType: string;
  studentId: string;
  volunteerId: string;
  createdAt: Date;
}

export type FeedbackDocument = Feedback & Document;

const feedbackSchema = new Schema({
  sessionId: {
    type: String,
    default: ''
  },

  type: {
    type: String,
    default: ''
  },

  subTopic: {
    type: String,
    default: ''
  },

  /**
   * Keys found in responseData
   *
   * session-goal: number | string (legacy)
   * subject-understanding: number
   * coach-rating: number
   * coach-ratings - (legacy)
   * favorite-coach: boolean
   * other-feedback
   * coach-feedback
   * session-rating: { rating: number }
   * coach-ratings: {
   *    coach-knowedgable: number,
   *    coach-friendly: number,
   *    coach-help-again: number
   * }
   *
   */
  responseData: {
    type: Object,
    default: ''
  },

  userType: {
    type: String,
    default: ''
  },

  studentId: {
    type: String,
    default: ''
  },

  volunteerId: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FeedbackModel = model<FeedbackDocument>('Feedback', feedbackSchema);

module.exports = FeedbackModel;
export default FeedbackModel;
