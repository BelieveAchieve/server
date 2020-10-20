import mongoose from 'mongoose';
import SessionService from '../../services/SessionService';
import { buildMessage } from '../generate';
import {
  insertVolunteer,
  insertSessionWithVolunteer,
  resetDb,
  insertStudent,
  insertSession
} from '../db-utils';
jest.mock('../../services/MailService');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await resetDb();
});

describe('calculateHoursTutored', () => {
  const similarTestCases = [
    'Return 0 hours tutored if no volunteer has joined the session',
    'Return 0 hours tutored if no volunteerJoinedAt and no endedAt',
    'Return 0 hours tutored if no messages were sent during the session'
  ];
  for (const testCase of similarTestCases) {
    test(testCase, async () => {
      const { session } = await insertSession();
      const result = await SessionService.calculateHoursTutored(session);
      const expectedHoursTutored = 0;

      expect(result).toEqual(expectedHoursTutored);
    });
  }

  test('Return 0 hours tutored if volunteer joined after session ended', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: buildMessage({
        user: volunteer._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Return 0 hours tutored if latest message was sent before a volunteer joined', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');
    const student = await insertStudent();
    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      student: student._id,
      messages: buildMessage({
        user: student._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Should return amount of hours tutored', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:01:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: buildMessage({
        user: volunteer._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0.03;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Should add hours tutored to user for sessions less than 3 hours', async () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T14:06:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSessionWithVolunteer({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T14:05:00.000Z')
        })
      ]
    });

    const hoursTutored = SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 2.08;
    expect(hoursTutored).toEqual(expectedHoursTutored);
  });

  // When sessions are greater than 3 hours, use the last messages that were sent
  // within a 15 minute window to get an estimate of the session length / hours tutored
  test('Should add hours tutored to user for sessions greater than 3 hours', async () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T16:00:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T14:05:00.000Z')
        }),
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T15:58:00.000Z')
        }),
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T15:59:00.000Z')
        })
      ]
    });

    const hoursTutored = SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 3.98;
    expect(hoursTutored).toEqual(expectedHoursTutored);
  });
});
