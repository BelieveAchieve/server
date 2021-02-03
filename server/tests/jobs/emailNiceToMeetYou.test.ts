import mongoose from 'mongoose';
import emailNiceToMeetYou from '../../worker/jobs/emailNiceToMeetYou';
import { insertVolunteer, resetDb } from '../db-utils';
import { buildVolunteer } from '../generate';
import MailService from '../../services/MailService';
import { log } from '../../worker/logger';
jest.mock('../../services/MailService');
jest.mock('../../worker/logger');

const oneHour = 1000 * 60 * 60 * 1;
const oneDay = oneHour * 24 * 1;

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

describe('Email nice to meet you to volunteers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should only send emails to volunteers created a day ago', async () => {
    const volunteerOne = buildVolunteer();
    const volunteerTwo = buildVolunteer({
      createdAt: new Date(Date.now() - oneDay)
    });
    const volunteerThree = buildVolunteer({
      createdAt: new Date(Date.now() - oneDay * 3)
    });
    await Promise.all([
      insertVolunteer(volunteerOne),
      insertVolunteer(volunteerTwo),
      insertVolunteer(volunteerThree)
    ]);
    await emailNiceToMeetYou();

    const expectedEmailsSent = 1;
    expect(log).toHaveBeenCalledWith(
      `Emailed "nice to meet you" to ${expectedEmailsSent} volunteers`
    );

    expect(MailService.sendNiceToMeetYou.mock.calls.length).toBe(
      expectedEmailsSent
    );
  });

  test('Should catch error when a problem with sending the email occurs', async () => {
    const volunteer = buildVolunteer({
      createdAt: new Date(Date.now() - oneDay)
    });
    await insertVolunteer(volunteer);

    const customErrorMessage = 'Unable to send';
    MailService.sendNiceToMeetYou = jest.fn(() => {
      throw new Error(customErrorMessage);
    });

    await emailNiceToMeetYou();

    const expectedEmailsSent = 0;
    expect((log as jest.Mock).mock.calls[0][0]).toBe(
      `Failed to email "nice to meet you" to volunteer ${volunteer._id}: Error: ${customErrorMessage}`
    );
    expect((log as jest.Mock).mock.calls[1][0]).toBe(
      `Emailed "nice to meet you" to ${expectedEmailsSent} volunteers`
    );
    expect(log).toHaveBeenCalledTimes(2);
  });
});
