import mongoose from 'mongoose'
import moment from 'moment-timezone'
import updateElapsedAvailability from '../../worker/jobs/updateElapsedAvailability'
import {
  getVolunteer,
  insertAvailabilitySnapshot,
  insertVolunteer,
  resetDb
} from '../db-utils'
import { buildAvailability, buildVolunteer } from '../generate'
import { log } from '../../worker/logger'
import * as AvailabilityService from '../../services/AvailabilityService'
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

describe('updateElapsedAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should not update volunteers with no availability snapshot', async () => {
    const clapton = buildVolunteer()
    await insertVolunteer(clapton)
    await updateElapsedAvailability()

    const expectedUpdatedVolunteers = 0
    expect(log).toHaveBeenCalledWith(
      `updated ${expectedUpdatedVolunteers} volunteers`
    )
  })

  test('Should update volunteer accounts that are onboarded and approved', async () => {
    const hendrix = buildVolunteer({
      isOnboarded: true,
      isApproved: true,
      elapsedAvailability: 10
    })
    const berry = buildVolunteer()
    const day = moment()
      .utc()
      .subtract(1, 'days')
      .format('dddd')
    await Promise.all([insertVolunteer(hendrix), insertVolunteer(berry)])
    await insertAvailabilitySnapshot({
      volunteerId: hendrix._id,
      onCallAvailability: buildAvailability({
        [day]: { '1p': true, '2p': true }
      })
    })

    await updateElapsedAvailability()
    const updatedHendrix = await getVolunteer(
      { _id: hendrix._id },
      { elapsedAvailability: 1 }
    )

    const newAvailabilityHistory = await AvailabilityService.getAvailabilityHistory(
      { volunteerId: hendrix._id },
      { availability: 1 }
    )

    const expectedTotalElapsedAvailability = 12
    expect(updatedHendrix.elapsedAvailability).toEqual(
      expectedTotalElapsedAvailability
    )

    const expectedAvailabilityDay = {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': true,
      '2p': true,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    }
    expect(newAvailabilityHistory.availability).toMatchObject(
      expectedAvailabilityDay
    )

    const expectedUpdatedVolunteers = 1
    expect(log).toHaveBeenCalledWith(
      `updated ${expectedUpdatedVolunteers} volunteers`
    )
  })
})
