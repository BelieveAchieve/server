import mongoose from 'mongoose'
import * as CalendarCtrl from '../../controllers/CalendarCtrl'
import {
  insertAvailabilitySnapshot,
  insertVolunteer,
  resetDb
} from '../db-utils'
import {
  buildAvailability,
  buildVolunteer,
  buildCertifications
} from '../generate'
import VolunteerModel, { Volunteer } from '../../models/Volunteer'
import UserActionModel from '../../models/UserAction'
import { USER_ACTION, SUBJECTS } from '../../constants'
import * as AvailabilityService from '../../services/AvailabilityService'

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

describe('Save availability and time zone', () => {
  test('Should throw error when not provided an availability', async () => {
    const input = {
      user: await insertVolunteer(),
      tz: 'American/New York',
      ip: ''
    }

    await expect(CalendarCtrl.updateSchedule(input)).rejects.toThrow(
      'No availability object specified'
    )
  })

  test('Should throw error when provided availability with missing keys', async () => {
    const volunteer: Volunteer = await insertVolunteer()
    const availability = buildAvailability()
    availability.Saturday = undefined
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability,
      ip: ''
    }

    await expect(CalendarCtrl.updateSchedule(input)).rejects.toThrow(
      'Availability object missing required keys'
    )
  })

  test('Should update availability (and user action fires) not onboarded', async () => {
    const volunteer = await insertVolunteer()
    await insertAvailabilitySnapshot({ volunteerId: volunteer._id })
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    })
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability,
      ip: ''
    }
    await CalendarCtrl.updateSchedule(input)

    const {
      availability: updatedAvailability,
      isOnboarded
    } = (await VolunteerModel.findOne({
      _id: volunteer._id
    })
      .lean()
      .select('availability isOnboarded')
      .exec()) as Volunteer
    const availabilitySnapshot = await AvailabilityService.getAvailability({
      volunteerId: volunteer._id
    })
    const expectedUserAction = await UserActionModel.findOne({
      user: volunteer._id,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    })

    expect(updatedAvailability).toMatchObject(availability)
    expect(availabilitySnapshot.onCallAvailability).toMatchObject(availability)
    expect(isOnboarded).toBeFalsy()
    expect(expectedUserAction).toBeNull()
  })

  test('Should update availability (and user action) and becomes onboarded - with user action', async () => {
    const certifications = buildCertifications({
      algebra: { passed: true, tries: 1 }
    })
    const volunteer = await insertVolunteer(
      buildVolunteer({
        certifications,
        subjects: [
          SUBJECTS.ALGEBRA_TWO,
          SUBJECTS.ALGEBRA_ONE,
          SUBJECTS.PREALGREBA
        ]
      })
    )
    await insertAvailabilitySnapshot({ volunteerId: volunteer._id })
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    })
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability,
      ip: ''
    }
    await CalendarCtrl.updateSchedule(input)

    const {
      availability: updatedAvailability,
      isOnboarded
    } = (await VolunteerModel.findOne({
      _id: volunteer._id
    })
      .lean()
      .select('availability isOnboarded')
      .exec()) as Volunteer
    const userAction = await UserActionModel.findOne({
      user: volunteer._id,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    })
    const availabilitySnapshot = await AvailabilityService.getAvailability({
      volunteerId: volunteer._id
    })
    const expectedUserAction = {
      user: volunteer._id,
      actionType: USER_ACTION.TYPE.ACCOUNT,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    }

    expect(updatedAvailability).toMatchObject(availability)
    expect(availabilitySnapshot.onCallAvailability).toMatchObject(availability)
    expect(isOnboarded).toBeTruthy()
    expect(userAction).toMatchObject(expectedUserAction)
  })
})

describe('Clear schedule', () => {
  test('Should clear schedule', async () => {
    const certifications = buildCertifications({
      algebra: { passed: true, tries: 1 }
    })
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    })
    const volunteer = await insertVolunteer(
      buildVolunteer({ availability, certifications })
    )
    const timezone = 'American/New York'

    await CalendarCtrl.clearSchedule(volunteer, timezone)

    const emptyAvailability = buildAvailability()
    const { availability: updatedAvailability } = (await VolunteerModel.findOne(
      {
        _id: volunteer._id
      }
    )
      .lean()
      .select('availability')
      .exec()) as Volunteer

    expect(updatedAvailability).toMatchObject(emptyAvailability)
  })
})
