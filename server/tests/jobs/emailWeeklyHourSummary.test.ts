import mongoose from 'mongoose'
import emailWeeklyHourSummary from '../../worker/jobs/emailWeeklyHourSummary'
import { getVolunteer, insertVolunteer, resetDb } from '../db-utils'
import { buildVolunteer } from '../generate'
import MailService from '../../services/MailService'
import { log } from '../../worker/logger'
import * as VolunteerService from '../../services/VolunteerService'
jest.mock('../../services/MailService')
jest.mock('../../worker/logger')

// db connection
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})

beforeEach(async () => {
  await resetDb()
})

describe('emailWeeklyHourSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should only send emails to volunteers with totalVolunteerHours greater than 0', async () => {
    const marvin = buildVolunteer()
    const otis = buildVolunteer()
    const whitney = buildVolunteer()

    await Promise.all([
      insertVolunteer(marvin),
      insertVolunteer(otis),
      insertVolunteer(whitney)
    ])

    const getHourSummaryStats = jest.spyOn(
      VolunteerService,
      'getHourSummaryStats'
    )
    getHourSummaryStats
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 2,
        totalQuizzesPassed: 1,
        totalElapsedAvailability: 0,
        totalVolunteerHours: 3
      }))
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 0,
        totalQuizzesPassed: 0,
        totalElapsedAvailability: 0,
        totalVolunteerHours: 0
      }))
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 5,
        totalQuizzesPassed: 0,
        totalElapsedAvailability: 3,
        totalVolunteerHours: 5.3
      }))

    await emailWeeklyHourSummary()

    const expectedEmailsSent = 2
    expect(log).toHaveBeenCalledWith(
      `Emailed weekly hour summary email to ${expectedEmailsSent} volunteers`
    )
    expect(
      (MailService.sendHourSummaryEmail as jest.Mock).mock.calls.length
    ).toBe(2)
  })

  test('Should set sentHourSummaryIntroEmail to true for volunteers that have not been sent sendHourSummaryEmail email before', async () => {
    const jackson = buildVolunteer({ sentHourSummaryIntroEmail: true })
    const warwick = buildVolunteer()
    const prince = buildVolunteer({ sentHourSummaryIntroEmail: true })

    await Promise.all([
      insertVolunteer(jackson),
      insertVolunteer(warwick),
      insertVolunteer(prince)
    ])

    const getHourSummaryStats = jest.spyOn(
      VolunteerService,
      'getHourSummaryStats'
    )
    getHourSummaryStats
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 1,
        totalQuizzesPassed: 1,
        totalElapsedAvailability: 1,
        totalVolunteerHours: 2.1
      }))
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 2,
        totalQuizzesPassed: 1,
        totalElapsedAvailability: 0,
        totalVolunteerHours: 3
      }))
      .mockImplementationOnce(async () => ({
        totalCoachingHours: 5,
        totalQuizzesPassed: 0,
        totalElapsedAvailability: 3,
        totalVolunteerHours: 5.3
      }))

    await emailWeeklyHourSummary()
    const updatedWarwick = await getVolunteer(
      { _id: warwick._id },
      { sentHourSummaryIntroEmail: 1 }
    )

    expect(updatedWarwick.sentHourSummaryIntroEmail).toBeTruthy()
  })

  test('Should catch error and log failed to send to volunteer', async () => {
    const jackson = buildVolunteer({ sentHourSummaryIntroEmail: true })
    await insertVolunteer(jackson)

    const getHourSummaryStats = jest.spyOn(
      VolunteerService,
      'getHourSummaryStats'
    )
    const customErrorMessage = 'Server error'
    getHourSummaryStats.mockImplementationOnce(() => {
      throw new Error(customErrorMessage)
    })

    await emailWeeklyHourSummary()

    const expectedEmailsSent = 0
    expect(log).toHaveBeenCalledWith(
      `Emailed weekly hour summary email to ${expectedEmailsSent} volunteers`
    )
    expect((log as jest.Mock).mock.calls[0][0]).toBe(
      `Failed to send weekly hour summary email to volunteer ${jackson._id}: Error: ${customErrorMessage}`
    )
  })
})
