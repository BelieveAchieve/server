import moment from 'moment';
import mongoose from 'mongoose';
import TwilioService from '../../services/twilio';
import { MATH_SUBJECTS, SAT_SUBJECTS } from '../../constants';
import { buildAvailability, buildSession, buildVolunteer } from '../generate';
import {
  insertNotification,
  insertSession,
  insertSessionWithVolunteer,
  insertVolunteer,
  resetDb
} from '../db-utils';

const MOCK_MOMENT = moment.utc('2020-01-01T05:00:00'); // Midnight EST
const MATCHING_AVAILABILITY = buildAvailability({ Wednesday: { '12a': true } });
const NON_MATCHING_AVAILABILITY = buildAvailability({
  Friday: { '12a': true }
});

const SESSION = buildSession({
  _id: 'abc123',
  type: 'college',
  subTopic: SAT_SUBJECTS.SAT_READING,
  addNotifications: jest.fn()
});

jest.mock('moment-timezone', () => ({
  utc: jest.fn(() => MOCK_MOMENT)
}));

jest.mock('../../config', () => ({
  client: { host: 'localhost' },
  accountSid: 'AC12345',
  authToken: '1234567890'
}));

jest.mock('twilio', () =>
  jest.fn(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({ sid: 'MM12345' }))
    }
  }))
);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  jest.clearAllMocks();
});

beforeEach(async () => {
  await resetDb();
});

test('Properly builds a session URL', () => {
  const sessionUrl = TwilioService.getSessionUrl(SESSION);

  expect(sessionUrl).toEqual(
    'http://localhost/session/college/satreading/abc123'
  );
});

test('Properly notifies a volunteer', async () => {
  await insertVolunteer(
    buildVolunteer({
      firstname: 'Austin',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  const notifiedVolunteer = await TwilioService.notifyVolunteer(SESSION);

  expect(notifiedVolunteer.firstname).toEqual('Austin');
});

test('Does nothing when no suitable volunteers are found', async () => {
  await insertVolunteer(
    buildVolunteer({
      isApproved: true,
      availability: NON_MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  const notifiedVolunteer = await TwilioService.notifyVolunteer(SESSION);

  expect(notifiedVolunteer).toBeNull();
});

test('Does nothing when all volunteers are in an active session', async () => {
  const sessionVolunteer = await insertVolunteer(
    buildVolunteer({
      firstname: 'Austin',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  const firstVolunteer = await TwilioService.notifyVolunteer(SESSION);
  await insertSessionWithVolunteer({ volunteer: sessionVolunteer });
  const secondVolunteer = await TwilioService.notifyVolunteer(SESSION);

  expect(firstVolunteer.firstname).toEqual('Austin');
  expect(secondVolunteer).toBeNull();
});

test('Prioritizes partner volunteers', async () => {
  await insertVolunteer(
    buildVolunteer({
      firstname: 'Twilion',
      volunteerPartnerOrg: 'Twilio',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  await insertVolunteer(
    buildVolunteer({
      firstname: 'Schmilion',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  const notifiedVolunteer = await TwilioService.notifyVolunteer(SESSION);

  expect(notifiedVolunteer.firstname).toEqual('Twilion');
});

test('Prioritizes non-high-level SME volunteers for non-high-level subjects', async () => {
  const fiveDaysAgo = new Date(
    new Date().getTime() - 5 * 24 * 3600 * 1000
  ).toISOString();

  const einstein = await insertVolunteer(
    buildVolunteer({
      firstname: 'Einstein',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING, MATH_SUBJECTS.CALCULUS_AB]
    })
  );
  const hemingway = await insertVolunteer(
    buildVolunteer({
      firstname: 'Hemingway',
      isApproved: true,
      availability: MATCHING_AVAILABILITY,
      subjects: [SAT_SUBJECTS.SAT_READING]
    })
  );
  await insertNotification(einstein, { sentAt: fiveDaysAgo });
  await insertNotification(hemingway, { sentAt: fiveDaysAgo });
  const notifiedVolunteer = await TwilioService.notifyVolunteer(SESSION);

  expect(notifiedVolunteer.firstname).toEqual('Hemingway');
});

test('Notifies only the failsafe volunteers', async () => {
  await insertVolunteer(
    buildVolunteer({
      isFailsafeVolunteer: true
    })
  );
  await insertVolunteer(buildVolunteer());
  const { session } = await insertSession();

  let notifications;
  session.addNotifications = async n => (notifications = n);

  await TwilioService.beginFailsafeNotifications(session);

  expect(notifications).toHaveLength(1);
});
