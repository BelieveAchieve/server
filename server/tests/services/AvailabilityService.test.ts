import mongoose from 'mongoose'
import {
  getAvailability,
  getAvailabilities,
  getAvailabilityHistory,
  getRecentAvailabilityHistory,
  getElapsedAvailabilityForDateRange,
  getElapsedAvailability
} from '../../services/AvailabilityService'
import {
  insertAvailabilitySnapshot,
  insertAvailabilityHistory,
  resetDb
} from '../db-utils'
import {
  buildVolunteer,
  buildAvailabilitySnapshot,
  buildAvailabilityHistory,
  buildAvailabilityDay
} from '../generate'
import AvailabilityHistoryModel from '../../models/Availability/History'
import AvailabilitySnapshotModel from '../../models/Availability/Snapshot'

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
  jest.clearAllMocks()
})

describe('getAvailability', () => {
  test('Should get an availability document given a query', async () => {
    const snapshot = await insertAvailabilitySnapshot()
    const result = await getAvailability({
      _id: snapshot._id
    })

    expect(result._id).toEqual(snapshot._id)
    expect(result.volunteerId).toEqual(snapshot.volunteerId)
  })
})

describe('getAvailabilities', () => {
  test('Should get multiple availability documents given a query', async () => {
    const snapshots = [
      buildAvailabilitySnapshot({
        createdAt: new Date('10/10/2020')
      }),
      buildAvailabilitySnapshot({
        createdAt: new Date('10/11/2020')
      }),
      buildAvailabilitySnapshot({
        createdAt: new Date('10/10/2021')
      }),
      buildAvailabilitySnapshot({
        createdAt: new Date('10/11/2021')
      })
    ]
    await AvailabilitySnapshotModel.insertMany(snapshots)

    const dateFilter = new Date('10/01/2021')
    const results = await getAvailabilities({
      createdAt: { $gte: dateFilter }
    })
    const expectedLength = 2
    expect(results).toHaveLength(expectedLength)

    for (const doc of results) {
      expect(doc.createdAt.getTime()).toBeGreaterThan(dateFilter.getTime())
    }
  })
})

describe('getAvailabilityHistory', () => {
  test('Should get an availability history document given a query', async () => {
    const availabilityHistory = await insertAvailabilityHistory()
    const result = await getAvailabilityHistory({
      _id: availabilityHistory._id
    })

    expect(result._id).toEqual(availabilityHistory._id)
    expect(result.volunteerId).toEqual(availabilityHistory.volunteerId)
  })
})

describe('getRecentAvailabilityHistory', () => {
  test('Should get most recent availability history for a volunteer', async () => {
    const newton = buildVolunteer()
    const volunteerId = newton._id
    const date = new Date()
    const newestDoc = buildAvailabilityHistory({
      date,
      volunteerId
    })
    const oldestDoc = buildAvailabilityHistory({
      date: new Date('10/10/2020'),
      volunteerId
    })
    const oldDoc = buildAvailabilityHistory({
      date: new Date('10/11/2020'),
      volunteerId
    })
    await AvailabilityHistoryModel.insertMany([newestDoc, oldestDoc, oldDoc])

    const result = await getRecentAvailabilityHistory(volunteerId)
    expect(result.date).toEqual(date)
  })
})

describe('getElapsedAvailabilityForDateRange', () => {
  test('Should get the total elapsed availability for a volunteer over given a date range', async () => {
    const turing = buildVolunteer()
    const volunteerId = turing._id
    await AvailabilityHistoryModel.insertMany([
      buildAvailabilityHistory({
        date: new Date('12/01/2020'),
        volunteerId,
        availability: buildAvailabilityDay({ '12p': true, '1p': true })
      }),
      buildAvailabilityHistory({
        date: new Date('12/02/2020'),
        volunteerId,
        availability: buildAvailabilityDay()
      }),
      buildAvailabilityHistory({
        date: new Date('12/03/2020'),
        volunteerId,
        availability: buildAvailabilityDay({
          '10a': true,
          '11a': true,
          '12p': true,
          '4p': true
        })
      }),
      buildAvailabilityHistory({
        date: new Date('12/04/2020'),
        volunteerId,
        availability: buildAvailabilityDay({ '4p': true, '5p': true })
      }),
      buildAvailabilityHistory({
        date: new Date('12/14/2020'),
        volunteerId,
        availability: buildAvailabilityDay({ '4p': true, '5p': true })
      })
    ])

    const fromDate = new Date('12/03/2020')
    const toDate = new Date('12/30/2020')
    const result = await getElapsedAvailabilityForDateRange(
      volunteerId,
      fromDate,
      toDate
    )

    const expectedElapsedAvailability = 8
    expect(result).toEqual(expectedElapsedAvailability)
  })
})

describe('getElapsedAvailability', () => {
  test('Should get elapsed availability of 0 when no hours are selected for the day', () => {
    const availabilityDay = buildAvailabilityDay()
    const result = getElapsedAvailability(availabilityDay)
    const expectedElapsedAvailability = 0
    expect(result).toBe(expectedElapsedAvailability)
  })

  test('Should get elapsed availability of 24 when all hours were selected for the day', () => {
    const overrides = {
      '12a': true,
      '1a': true,
      '2a': true,
      '3a': true,
      '4a': true,
      '5a': true,
      '6a': true,
      '7a': true,
      '8a': true,
      '9a': true,
      '10a': true,
      '11a': true,
      '12p': true,
      '1p': true,
      '2p': true,
      '3p': true,
      '4p': true,
      '5p': true,
      '6p': true,
      '7p': true,
      '8p': true,
      '9p': true,
      '10p': true,
      '11p': true
    }
    const availabilityDay = buildAvailabilityDay(overrides)
    const result = getElapsedAvailability(availabilityDay)
    const expectedElapsedAvailability = 24
    expect(result).toBe(expectedElapsedAvailability)
  })

  test('Should get elapsed availability of 5 when only 5 hour periods are selected', () => {
    const overrides = {
      '10a': true,
      '11a': true,
      '12p': true,
      '4p': true,
      '5p': true
    }
    const availabilityDay = buildAvailabilityDay(overrides)
    const result = getElapsedAvailability(availabilityDay)
    const expectedElapsedAvailability = 5
    expect(result).toBe(expectedElapsedAvailability)
  })
})
