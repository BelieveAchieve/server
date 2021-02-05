import mongoose from 'mongoose'
import request, { Test } from 'supertest'
import app from '../../app'
import { insertVolunteer, resetDb } from '../db-utils'
import { buildAvailability, authLogin } from '../generate'

const agent = request.agent(app)

const saveCalendar = (form): Test =>
  agent
    .post('/api/calendar/save')
    .set('Accept', 'application/json')
    .send(form)

const clearCalendar = (form): Test =>
  agent
    .post('/api/calendar/clear')
    .set('Accept', 'application/json')
    .send(form)

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

describe('Calendar routes', () => {
  test('Volunteer should see error when saving without availability object', async () => {
    const volunteer = await insertVolunteer()
    const input = {
      tz: 'American/New York'
    }

    await authLogin(agent, volunteer)
    const response = await saveCalendar(input).expect(500)
    const {
      body: { err }
    } = response

    const expected = 'No availability object specified'
    expect(err).toEqual(expected)
  })

  test('Volunteer should see error when availability misses required keys', async () => {
    const volunteer = await insertVolunteer()
    const availability = buildAvailability()
    availability.Saturday = undefined
    const input = {
      tz: 'American/New York',
      availability
    }

    await authLogin(agent, volunteer)
    const response = await saveCalendar(input).expect(500)
    const {
      body: { err }
    } = response

    const expected = 'Availability object missing required keys'
    expect(err).toEqual(expected)
  })

  test('Volunteer should save schedule', async () => {
    const volunteer = await insertVolunteer()
    const availability = buildAvailability({
      Saturday: { '1a': true },
      Friday: { '11a': true }
    })
    const input = {
      tz: 'American/New York',
      availability
    }

    await authLogin(agent, volunteer)
    const response = await saveCalendar(input).expect(200)

    const {
      body: { msg }
    } = response

    const expected = 'Schedule saved'

    expect(msg).toEqual(expected)
  })

  test('Volunteer should be able to clear schedule (admins only currently)', async () => {
    const volunteer = await insertVolunteer()
    const input = {
      tz: 'American/New York'
    }

    await authLogin(agent, volunteer)
    const response = await clearCalendar(input).expect(200)

    const {
      body: { msg }
    } = response

    const expected = 'Schedule cleared'

    expect(msg).toEqual(expected)
  })
})
