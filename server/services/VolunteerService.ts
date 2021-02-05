import { Types } from 'mongoose'
import VolunteerModel from '../models/Volunteer'
import { getTimeTutoredForDateRange } from './SessionService'
import { getElapsedAvailabilityForDateRange } from './AvailabilityService'
import { getQuizzesPassedForDateRange } from './UserActionService'

export const getVolunteers = async (
  query,
  projection = {}
  // @todo: Use Volunteer interface once converted inside /models/Volunteer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> =>
  VolunteerModel.find(query)
    .select(projection)
    .lean()
    .exec()

export const getHourSummaryStats = async (
  volunteerId: Types.ObjectId | string,
  fromDate: Date,
  toDate: Date
): Promise<{
  totalCoachingHours: number
  totalQuizzesPassed: number
  totalElapsedAvailability: number
  totalVolunteerHours: number
}> => {
  // @todo: promise.all fails fast, do we want this? - handle error
  const [
    quizzesPassed,
    elapsedAvailability,
    timeTutoredMS
  ] = await Promise.all([
    getQuizzesPassedForDateRange(volunteerId, fromDate, toDate),
    getElapsedAvailabilityForDateRange(volunteerId, fromDate, toDate),
    getTimeTutoredForDateRange(volunteerId, fromDate, toDate)
  ])

  const timeTutoredInHours = Number(timeTutoredMS / 3600000).toFixed(2)
  const totalCoachingHours = Number(timeTutoredInHours)
  // Total volunteer hours calculation: [sum of coaching, elapsed avail/10, and quizzes]
  const totalVolunteerHours = Number(
    totalCoachingHours + quizzesPassed.length + elapsedAvailability * 0.1
  ).toFixed(2)
  return {
    totalCoachingHours,
    totalQuizzesPassed: quizzesPassed.length,
    totalElapsedAvailability: elapsedAvailability,
    totalVolunteerHours: Number(totalVolunteerHours)
  }
}
