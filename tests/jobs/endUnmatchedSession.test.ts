import mongoose from 'mongoose';
import {
  resetDb,
  insertSessionWithVolunteer,
  insertSession,
  getSession
} from '../db-utils';
import endUnmatchedSession from '../../worker/jobs/endUnmatchedSession';
import { log } from '../../worker/logger';
import SessionService from '../../services/SessionService';
jest.mock('../../worker/logger');

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

describe('End unmatched session', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('Should log when no session is found', async () => {
    const _id = mongoose.Types.ObjectId();
    // @todo: figure out how to properly type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job: any = {
      data: {
        sessionId: _id
      }
    };

    await endUnmatchedSession(job);
    expect(log).toHaveBeenCalledWith(`session ${_id} not found`);
  });

  test('Should not end session when session is fulfilled', async () => {
    const { session } = await insertSessionWithVolunteer();
    // @todo: figure out how to properly type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job: any = {
      data: {
        sessionId: session._id
      }
    };

    await endUnmatchedSession(job);
    expect(log).toHaveBeenCalledWith(
      `session ${session._id} fulfilled, cancel ending unmatched session`
    );
  });

  test('Should catch error when ending a session', async () => {
    const { session } = await insertSession();
    // @todo: figure out how to properly type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job: any = {
      data: {
        sessionId: session._id
      }
    };
    const error = new Error('unable to end session');
    const mockedEndSession = jest.spyOn(SessionService, 'endSession').mockRejectedValueOnce(error);

    await endUnmatchedSession(job);
    mockedEndSession.mockRestore();
    expect(log).toHaveBeenCalledWith(
      `Failed to end unmatched session: ${session._id}: ${error}`
    );
  });

  test('Should end session unmatched session', async () => {
    const { session } = await insertSession();
    // @todo: figure out how to properly type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job: any = {
      data: {
        sessionId: session._id
      }
    };

    await endUnmatchedSession(job);

    const query = { _id: session._id.toString() };
    const projection = { endedAt: 1 };
    const updatedSession = await getSession(query, projection);

    expect(updatedSession.endedAt).toBeTruthy();
    expect(log).toHaveBeenCalledWith(`Ended unmatched session: ${session._id}`);
  });
});
