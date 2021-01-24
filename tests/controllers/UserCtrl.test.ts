import mongoose from 'mongoose';
import { createVolunteer } from '../../controllers/UserCtrl';
import { getVolunteer, resetDb } from '../db-utils';
import { buildVolunteer } from '../generate';
import { getAvailability } from '../../services/AvailabilityService';

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

describe('createVolunteer', () => {
  test('Should create a volunteer and availability', async () => {
    const newVolunteer = buildVolunteer();
    await createVolunteer(newVolunteer);
    const einstein = await getVolunteer({ _id: newVolunteer._id });
    const newAvailability = await getAvailability({
      volunteerId: einstein._id
    });

    expect(einstein._id).toEqual(newVolunteer._id);
    expect(newAvailability.volunteerId).toEqual(newVolunteer._id);
  });
});
