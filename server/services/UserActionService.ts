import { Types } from 'mongoose'
import { USER_ACTION } from '../constants'
import UserActionModel from '../models/UserAction'

export const getQuizzesPassedForDateRange = (
  volunteerId: Types.ObjectId | string,
  fromDate: Date,
  toDate: Date
  // @todo: figure out how to properly type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> =>
  UserActionModel.find({
    user: volunteerId,
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    },
    action: USER_ACTION.QUIZ.PASSED
  })
    .lean()
    .exec()
