import mongoose from 'mongoose'
import emailReadyToCoach from '../../worker/jobs/emailReadyToCoach'
import { insertVolunteer, resetDb } from '../db-utils'
import { buildVolunteer } from '../generate'
import VolunteerModel, { Volunteer } from '../../models/Volunteer'
import MailService from '../../services/MailService'
jest.mock('../../services/MailService')

const buildReadyToSendVolunteer = (): Partial<Volunteer> => {
  return buildVolunteer({
    isOnboarded: true,
    isApproved: true,
    sentReadyToCoachEmail: false
  })
}

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

describe('Ready to coach email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should send ready to coach email for waiting volunteers', async () => {
    await Promise.all([
      insertVolunteer(buildReadyToSendVolunteer()),
      insertVolunteer(buildReadyToSendVolunteer()),
      insertVolunteer(buildReadyToSendVolunteer())
    ])

    await emailReadyToCoach()

    const volunteers = await VolunteerModel.find()
      .lean()
      .select('sentReadyToCoachEmail')
      .exec()

    for (const volunteer of volunteers) {
      expect(volunteer.sentReadyToCoachEmail).toBeTruthy()
    }

    expect(
      (MailService.sendReadyToCoachEmail as jest.Mock).mock.calls.length
    ).toBe(3)
  })
  test('Should not send ready to coach email for volunteers that have not completed onboarding and not yet approved', async () => {
    await Promise.all([
      insertVolunteer(buildVolunteer()),
      insertVolunteer(buildVolunteer()),
      insertVolunteer(buildVolunteer())
    ])

    await emailReadyToCoach()

    const volunteers = await VolunteerModel.find()
      .lean()
      .select('sentReadyToCoachEmail')
      .exec()

    for (const volunteer of volunteers) {
      expect(volunteer.sentReadyToCoachEmail).toBeFalsy()
    }
    expect(
      (MailService.sendReadyToCoachEmail as jest.Mock).mock.calls.length
    ).toBe(0)
  })
})
