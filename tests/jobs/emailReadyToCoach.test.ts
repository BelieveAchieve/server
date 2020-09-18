import mongoose from 'mongoose';
import emailReadyToCoach from '../../worker/jobs/emailReadyToCoach';
import { insertVolunteer, resetDb } from '../utils/db-utils';
import { buildVolunteer } from '../utils/generate';
import VolunteerModel from '../../models/Volunteer';
import MailService from '../../services/MailService';
import { Volunteer } from '../utils/types';
jest.mock('../../services/MailService');

const buildReadyToSendVolunteer = (): Volunteer => {
  return buildVolunteer({
    isOnboarded: true,
    isApproved: true,
    sentReadyToCoachEmail: false
  });
};

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

describe('Ready to coach email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should send ready to coach email for waiting volunteers', async () => {
    await Promise.all([
      insertVolunteer(buildReadyToSendVolunteer()),
      insertVolunteer(buildReadyToSendVolunteer()),
      insertVolunteer(buildReadyToSendVolunteer())
    ]);

    await emailReadyToCoach();

    const volunteers = (await VolunteerModel.find()
      .lean()
      .select('sentReadyToCoachEmail')
      .exec()) as Volunteer[];

    for (const volunteer of volunteers) {
      expect(volunteer.sentReadyToCoachEmail).toBeTruthy();
    }

    expect(MailService.sendReadyToCoachEmail.mock.calls.length).toBe(3);
  });
  test('Should not send ready to coach email for volunteers that have not completed onboarding and not yet approved', async () => {
    await Promise.all([
      insertVolunteer(buildVolunteer()),
      insertVolunteer(buildVolunteer()),
      insertVolunteer(buildVolunteer())
    ]);

    await emailReadyToCoach();

    const volunteers = (await VolunteerModel.find()
      .lean()
      .select('sentReadyToCoachEmail')
      .exec()) as Volunteer[];

    for (const volunteer of volunteers) {
      expect(volunteer.sentReadyToCoachEmail).toBeFalsy();
    }
    expect(MailService.sendReadyToCoachEmail.mock.calls.length).toBe(0);
  });
});
