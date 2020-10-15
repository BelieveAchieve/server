import { values } from 'lodash';
import { Document, model, Schema, Types } from 'mongoose';
import { User } from './User';
import { SURVEY_TYPES } from '../constants';

export interface Survey {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  responseData: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  user: Types.ObjectId | User;
  surveyType: SURVEY_TYPES;
  createdAt: Date;
}

export type SurveyDocument = Survey & Document;

const surveySchema = new Schema({
  session: {
    type: Types.ObjectId,
    ref: 'Session'
  },

  user: {
    type: Types.ObjectId,
    ref: 'User'
  },

  surveyType: {
    type: String,
    enum: values(SURVEY_TYPES)
  },

  responseData: {
    type: Object,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SurveyModel = model<SurveyDocument>('Survey', surveySchema);

module.exports = SurveyModel;
export default SurveyModel;
