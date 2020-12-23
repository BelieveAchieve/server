import mongoose from 'mongoose';
import request, { Test } from 'supertest';
import app from '../../app';
import { Student, Volunteer } from '../types';
import { authLogin } from '../generate';
import {
  resetDb,
  insertStudent,
  insertSession,
  insertSessionWithVolunteer,
  insertVolunteer,
  getSession
} from '../db-utils';
import { SESSION_REPORT_REASON, USER_ACTION } from '../../constants';
import UserActionModel from '../../models/UserAction';
jest.mock('../../services/SocketService');
jest.mock('../../services/QueueService');
jest.mock('../../services/twilio');

const agent = request.agent(app);
// @todo: Figure out how to avoid using loginStudent for each test
//        note: does not work properly when placed in a beforeEach
const loginStudent = async (): Promise<Student> => {
  const student = await insertStudent();
  await authLogin(agent, student);

  return student;
};

const loginVolunteer = async (): Promise<Volunteer> => {
  const volunteer = await insertVolunteer();
  await authLogin(agent, volunteer);

  return volunteer;
};

const startNewSession = (data): Test =>
  agent
    .post('/api/session/new')
    .set('Accept', 'application/json')
    .send(data);

const endSession = (data): Test =>
  agent
    .post('/api/session/end')
    .set('Accept', 'application/json')
    .send(data);

const reportSession = (sessionId, data): Test =>
  agent
    .post(`/api/session/${sessionId}/report`)
    .set('Accept', 'application/json')
    .send(data);

const timedOutSession = (sessionId, data): Test =>
  agent
    .post(`/api/session/${sessionId}/timed-out`)
    .set('Accept', 'application/json')
    .send(data);

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

describe('/session/new', () => {
  const newSessionData = { sessionSubTopic: 'algebraone', sessionType: 'math' };

  test('Should start a new session', async () => {
    await loginStudent();
    const response = await startNewSession(newSessionData).expect(200);
    const {
      body: { sessionId }
    } = response;

    expect(mongoose.Types.ObjectId.isValid(sessionId)).toBeTruthy();
  });

  test('Should not start a new session for an unsupported subject', async () => {
    await loginStudent();
    const data = { sessionSubTopic: 'platonism', sessionType: 'philosophy' };
    await startNewSession(data).expect(404);
  });

  test(`Should create a ${USER_ACTION.SESSION.REQUESTED} user action`, async () => {
    const plato = await loginStudent();
    const response = await startNewSession(newSessionData).expect(200);
    const {
      body: { sessionId }
    } = response;

    const userAction = await UserActionModel.findOne({
      user: plato._id,
      session: sessionId
    });

    expect(userAction.action).toBe(USER_ACTION.SESSION.REQUESTED);
  });
});

describe('/session/end', () => {
  test('Should end a new session', async () => {
    const aristotle = await loginStudent();
    const { session } = await insertSession({ student: aristotle._id });
    const response = await endSession({ sessionId: session._id }).expect(200);
    const {
      body: { sessionId }
    } = response;

    expect(mongoose.Types.ObjectId.isValid(sessionId)).toBeTruthy();
  });

  test('Should not end session if not session participant', async () => {
    await loginStudent();
    const { session } = await insertSession();
    const response = await endSession({ sessionId: session._id }).expect(500);
    const {
      body: { err }
    } = response;

    const expectedError = 'Only session participants can end a session';

    expect(err).toEqual(expectedError);
  });

  test(`Should create a ${USER_ACTION.SESSION.ENDED} user action`, async () => {
    const aristotle = await loginStudent();
    const { session } = await insertSession({ student: aristotle });
    const response = await endSession({ sessionId: session._id }).expect(200);
    const {
      body: { sessionId }
    } = response;

    const userAction = await UserActionModel.findOne({
      user: aristotle._id,
      session: sessionId
    });

    expect(userAction.action).toBe(USER_ACTION.SESSION.ENDED);
  });
});

describe('/session/:sessionId/report', () => {
  test('A volunteer should be able to report a session', async () => {
    const socrates = await loginVolunteer();
    const data = {
      reportReason: SESSION_REPORT_REASON.STUDENT_RUDE,
      reportMessage: ''
    };
    const { session } = await insertSessionWithVolunteer({
      volunteer: socrates._id
    });

    const response = await reportSession(session._id, data).expect(200);
    const {
      body: { msg }
    } = response;
    const reportedSession = await getSession(
      { _id: session._id },
      { isReported: 1 }
    );

    expect(reportedSession.isReported).toBeTruthy();
    expect(msg).toEqual('Success');
  });

  // @todo: figure out why this doesn't pass CI
  // test('A student should not be able to report a session', async () => {
  //   await loginStudent();
  //   const data = {
  //     reportReason: '',
  //     reportMessage: ''
  //   };
  //   const { session } = await insertSessionWithVolunteer();
  //   const response = await reportSession(session._id, data).expect(401);
  //   const {
  //     body: { err }
  //   } = response;

  //   const expectedError = 'Unable to report this session';
  //   expect(err).toEqual(expectedError);
  // });

  test('Should not be able to report a session if it has no volunteer', async () => {
    await loginStudent();
    const data = {
      reportReason: '',
      reportMessage: ''
    };
    const { session } = await insertSession();
    const response = await reportSession(session._id, data).expect(401);
    const {
      body: { err }
    } = response;

    const expectedError = 'Unable to report this session';
    expect(err).toEqual(expectedError);
  });
});

describe('/session/:sessionId/time-out', () => {
  // @todo: figure out why this doesn't pass CI
  // test(`Should see user action for ${USER_ACTION.SESSION.TIMED_OUT_15_MINS} after a session timeout of 15 mins`, async () => {
  //   const descartes = await loginStudent();
  //   const data = {
  //     timeout: 15
  //   };
  //   const { session } = await insertSession({
  //     student: descartes._id
  //   });

  //   await timedOutSession(session._id, data).expect(200);
  //   const userAction = await UserActionModel.findOne({
  //     user: descartes._id,
  //     session: session
  //   });
  //   expect(userAction.action).toBe(USER_ACTION.SESSION.TIMED_OUT_15_MINS);
  // });

  test(`Should see a user action for ${USER_ACTION.SESSION.TIMED_OUT_45_MINS} after a session timeout of 45 mins`, async () => {
    const descartes = await loginStudent();
    const data = {
      timeout: 45
    };
    const { session } = await insertSession({
      student: descartes._id
    });
    await timedOutSession(session._id, data).expect(200);
    const userAction = await UserActionModel.findOne({
      user: descartes._id,
      session: session
    });
    expect(userAction.action).toBe(USER_ACTION.SESSION.TIMED_OUT_45_MINS);
  });
});
