import { Document, model, Schema } from 'mongoose';

export interface Feedback extends Document {
  sessionId: string;
  type: string;
  subTopic: string;
  responseData: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  userType: string;
  studentId: string;
  volunteerId: string;
  createdAt: Date;
}

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

const FeedbackModel = model<Feedback>('Feedback', feedbackSchema);

module.exports = FeedbackModel;
export default FeedbackModel;
