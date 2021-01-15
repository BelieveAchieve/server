import mongoose from 'mongoose';
import { USER_ACTION } from '../../constants';
import { getQuizzesPassedForDateRange } from '../../services/UserActionService';
import { insertUserAction, resetDb } from '../db-utils';
import { buildVolunteer } from '../generate';

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
  jest.clearAllMocks();
});

describe('getQuizzesPassedForDateRange', () => {
  test('Should get quiz passed user actions created between a date range', async () => {
    const { _id: volunteerId } = buildVolunteer();
    const action = USER_ACTION.QUIZ.PASSED;
    const actionType = USER_ACTION.TYPE.QUIZ;
    await Promise.all([
      insertUserAction({
        createdAt: new Date('12/10/2020'),
        action,
        actionType,
        user: volunteerId
      }),
      insertUserAction({
        createdAt: new Date('12/14/2020'),
        action,
        actionType,
        user: volunteerId
      }),
      insertUserAction({
        createdAt: new Date('12/21/2020'),
        action,
        actionType,
        user: volunteerId
      }),
      insertUserAction({
        createdAt: new Date('12/25/2020'),
        action,
        actionType,
        user: volunteerId
      })
    ]);

    const fromDate = new Date('12/13/2020');
    const toDate = new Date('12/22/2020');

    const userActions = await getQuizzesPassedForDateRange(
      volunteerId,
      fromDate,
      toDate
    );
    expect(userActions).toHaveLength(2);

    for (const action of userActions) {
      expect(action.createdAt.getTime()).toBeGreaterThanOrEqual(
        fromDate.getTime()
      );
      expect(action.createdAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
    }
  });
});
