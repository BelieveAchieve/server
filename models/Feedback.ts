import { Document, model, Schema, Types } from 'mongoose';

export interface Feedback {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  type: string;
  subTopic: string;
  responseData: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  userType: string;
  studentId: Types.ObjectId;
  volunteerId: Types.ObjectId;
  createdAt: Date;
}

export type FeedbackDocument = Feedback & Document;

const feedbackSchema = new Schema({
  sessionId: {
    type: Types.ObjectId
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
   * session-goal: number
   * session-goal: string (legacy. only in college sessions currently)
   * subject-understanding: number
   * coach-rating: number
   * other-feedback: string
   * coach-feedback: string
   * rate-session: { rating: number }
   * coach-ratings: (legacy. only in college session currently) {
   *    coach-knowedgable: number,
   *    coach-friendly: number,
   *    coach-help-again: number
   * }
   * session-experience: {
   *    easy-to-answer-questions: number,
   *    feel-like-helped-student: number,
   *    feel-more-fulfilled: number,
   *    good-use-of-time: number,
   *    plan-on-volunteering-again: number
   * }
   * rate-upchieve: {
   *    achieve-goal: number,
   *    easy-to-use: number,
   *    get-help-faster: number,
   *    use-next-time: number,
   * }
   * rate-coach: {
   *    achieve-goal: number
   *    find-help: number,
   *    knowledgeable: number,
   *    nice: number,
   *    want-him/her-again: number,
   * }
   * technical-difficulties: string,
   * asked-unprepared-questions: string,
   * app-features-needed: string
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
    type: Types.ObjectId
  },

  volunteerId: {
    type: Types.ObjectId
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FeedbackModel = model<FeedbackDocument>('Feedback', feedbackSchema);

module.exports = FeedbackModel;
export default FeedbackModel;
