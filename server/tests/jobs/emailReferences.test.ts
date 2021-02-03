import mongoose, { Aggregate } from 'mongoose';
import emailReferences from '../../worker/jobs/emailReferences';
import { insertVolunteer, resetDb } from '../db-utils';
import { buildVolunteer, buildReference } from '../generate';
import VolunteerModel, { Reference } from '../../models/Volunteer';
import MailService from '../../services/MailService';
import { Volunteer } from '../types';
import { REFERENCE_STATUS } from '../../constants';
jest.mock('../../services/MailService');

const buildVolunteerWithReferences = (): Volunteer => {
  return buildVolunteer({
    references: [
      buildReference({
        status: REFERENCE_STATUS.UNSENT
      }),
      buildReference({
        status: REFERENCE_STATUS.UNSENT
      })
    ]
  });
};

const getReferences = (): Aggregate<Reference[]> => {
  return VolunteerModel.aggregate([
    {
      $unwind: '$references'
    },
    {
      $project: {
        status: '$references.status',
        _id: 0,
        firstName: '$references.firstName',
        lastName: '$references.lastName',
        email: '$references.email',
        createdAt: '$references.createdAt',
        sentAt: '$references.sentAt'
      }
    }
  ]);
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

describe('Email references', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should send email references the reference form', async () => {
    await Promise.all([
      insertVolunteer(buildVolunteerWithReferences()),
      insertVolunteer(buildVolunteerWithReferences())
    ]);
    await emailReferences();

    const references = await getReferences();

    for (const reference of references) {
      expect(reference.status).toEqual(REFERENCE_STATUS.SENT);
    }
    expect(MailService.sendReferenceForm.mock.calls.length).toBe(4);
  });

  test('Should not send any references the reference form', async () => {
    await Promise.all([
      insertVolunteer(buildVolunteer()),
      insertVolunteer(
        buildVolunteer({
          references: [
            buildReference({ status: REFERENCE_STATUS.SENT }),
            buildReference({ status: REFERENCE_STATUS.SUBMITTED })
          ]
        })
      )
    ]);
    await emailReferences();

    expect(MailService.sendReferenceForm.mock.calls.length).toBe(0);
  });
});
