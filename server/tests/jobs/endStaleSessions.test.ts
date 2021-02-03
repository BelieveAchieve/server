import mongoose from 'mongoose';
import { resetDb, insertSession } from '../db-utils';
import SessionModel from '../../models/Session';
import endStaleSessions from '../../worker/jobs/endStaleSessions';

// db connection
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

describe('End stale sessions', () => {
  test('Should end sessions that were created more than 12 hours ago', async () => {
    const thirteenHours = 1000 * 60 * 60 * 13;
    const twelveHours = 1000 * 60 * 60 * 12;

    await Promise.all([
      insertSession({
        createdAt: new Date().getTime() - thirteenHours
      }),
      insertSession({
        createdAt: new Date().getTime() - twelveHours
      }),
      insertSession()
    ]);
    await endStaleSessions();

    const sessions = await SessionModel.find()
      .lean()
      .exec();

    for (const session of sessions) {
      if (new Date(session.createdAt).getTime() <= twelveHours)
        expect(session.endedBy).toBeNull();
    }
  });
});
