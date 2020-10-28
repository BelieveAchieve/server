import mongoose from 'mongoose';
import CalendarCtrl from '../../controllers/CalendarCtrl';
import { insertVolunteer, resetDb } from '../db-utils';
import {
  buildAvailability,
  buildVolunteer,
  buildCertifications
} from '../generate';
import VolunteerModel from '../../models/Volunteer';
import UserActionModel from '../../models/UserAction';
import { Volunteer } from '../types';
import { USER_ACTION, SUBJECTS } from '../../constants';

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

describe('Save availability and time zone', () => {
  test('Should throw error when not provided an availability', async () => {
    const input = {
      tz: 'American/New York'
    };

    await expect(CalendarCtrl.updateSchedule(input)).rejects.toThrow(
      'No availability object specified'
    );
  });

  test('Should throw error when provided availability with missing keys', async () => {
    const volunteer = await insertVolunteer();
    const availability = buildAvailability();
    availability.Saturday = undefined;
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability
    };

    await expect(CalendarCtrl.updateSchedule(input)).rejects.toThrow(
      'Availability object missing required keys'
    );
  });

  test('Should update availability (and user action fires) not onboarded', async () => {
    const volunteer = await insertVolunteer();
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    });
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability
    };
    await CalendarCtrl.updateSchedule(input);

    const {
      availability: updatedAvailability,
      isOnboarded
    } = (await VolunteerModel.findOne({
      _id: volunteer._id
    })
      .lean()
      .select('availability isOnboarded')
      .exec()) as Volunteer;
    const expectedUserAction = await UserActionModel.findOne({
      user: volunteer._id,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    });

    expect(updatedAvailability).toMatchObject(availability);
    expect(isOnboarded).toBeFalsy();
    expect(expectedUserAction).toBeNull();
  });

  test('Should update availability (and user action) and becomes onboarded - with user action', async () => {
    const certifications = buildCertifications({
      algebra: { passed: true, tries: 1 }
    });
    const volunteer = await insertVolunteer(
      buildVolunteer({
        certifications,
        subjects: [
          SUBJECTS.ALGEBRA_TWO,
          SUBJECTS.ALGEBRA_ONE,
          SUBJECTS.PREALGREBA
        ]
      })
    );
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    });
    const input = {
      user: volunteer,
      tz: 'American/New York',
      availability
    };
    await CalendarCtrl.updateSchedule(input);

    const {
      availability: updatedAvailability,
      isOnboarded
    } = (await VolunteerModel.findOne({
      _id: volunteer._id
    })
      .lean()
      .select('availability isOnboarded')
      .exec()) as Volunteer;
    const userAction = await UserActionModel.findOne({
      user: volunteer._id,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    });

    const expectedUserAction = {
      user: volunteer._id,
      actionType: USER_ACTION.TYPE.ACCOUNT,
      action: USER_ACTION.ACCOUNT.ONBOARDED
    };

    expect(updatedAvailability).toMatchObject(availability);
    expect(isOnboarded).toBeTruthy();
    expect(userAction).toMatchObject(expectedUserAction);
  });
});

describe('Clear schedule', () => {
  test('Should clear schedule', async () => {
    const certifications = buildCertifications({
      algebra: { passed: true, tries: 1 }
    });
    const availability = buildAvailability({
      Saturday: { '1p': true, '2p': true }
    });
    const volunteer = await insertVolunteer(
      buildVolunteer({ availability, certifications })
    );
    const timeZone = 'American/New York';

    await CalendarCtrl.clearSchedule(volunteer, timeZone);

    const emptyAvailability = buildAvailability();
    const { availability: updatedAvailability } = (await VolunteerModel.findOne(
      {
        _id: volunteer._id
      }
    )
      .lean()
      .select('availability')
      .exec()) as Volunteer;

    expect(updatedAvailability).toMatchObject(emptyAvailability);
  });
});
