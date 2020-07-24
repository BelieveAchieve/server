import mongoose from 'mongoose';
import UserService from '../../../services/UserService';
import VolunteerModel from '../../../models/Volunteer';
import UserActionModel from '../../../models/UserAction';
import {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  STATUS,
  USER_ACTION
} from '../../../constants';
import { Volunteer } from '../../utils/types';
import {
  buildVolunteer,
  buildReference,
  buildReferenceForm,
  buildPhotoIdData,
  buildReferenceWithForm,
  buildBackgroundInfo
} from '../../utils/generate';
import { insertVolunteer, resetDb } from '../../utils/db-utils';
jest.mock('../../../services/MailService');

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

test('Successfully adds photoIdS3Key and photoIdStatus', async () => {
  const volunteer = buildVolunteer();
  await insertVolunteer(volunteer);
  const { _id: userId } = volunteer;
  const newPhotoIdS3Key = await UserService.addPhotoId({ userId });
  // @note: UserActionCtrl methods are not being awaited in the UserService. tests can potentially
  //        fail if the test completes before the user action is stored
  const userAction = await UserActionModel.findOne({
    user: userId,
    action: USER_ACTION.ACCOUNT.ADDED_PHOTO_ID
  });

  const updatedVolunteer: Partial<Volunteer> = await VolunteerModel.findOne({
    _id: userId
  })
    .select('photoIdS3Key photoIdStatus')
    .lean()
    .exec();

  const expectedUserAction = {
    user: userId,
    action: USER_ACTION.ACCOUNT.ADDED_PHOTO_ID
  };

  expect(newPhotoIdS3Key).toMatch(/^[a-f0-9]{64}$/);
  expect(updatedVolunteer.photoIdS3Key).toEqual(newPhotoIdS3Key);
  expect(updatedVolunteer.photoIdStatus).toEqual(PHOTO_ID_STATUS.SUBMITTED);
  expect(updatedVolunteer.photoIdStatus).not.toEqual(PHOTO_ID_STATUS.EMPTY);
  expect(userAction).toMatchObject(expectedUserAction);
});

test('Should add a reference', async () => {
  const volunteer = buildVolunteer();
  await insertVolunteer(volunteer);
  const { _id: userId } = volunteer;
  const reference = buildReference();
  const input = {
    userId,
    referenceFirstName: reference.firstName,
    referenceLastName: reference.lastName,
    referenceEmail: reference.email
  };

  await UserService.addReference(input);

  const updatedVolunteer: Partial<Volunteer> = await VolunteerModel.findOne({
    _id: userId
  })
    .select('references')
    .lean()
    .exec();
  const userAction = await UserActionModel.findOne({
    user: volunteer._id,
    action: USER_ACTION.ACCOUNT.ADDED_REFERENCE
  });

  const expectedReference = {
    firstName: input.referenceFirstName,
    lastName: input.referenceLastName,
    email: input.referenceEmail,
    status: REFERENCE_STATUS.UNSENT
  };
  const expectedUserAction = {
    user: volunteer._id,
    action: USER_ACTION.ACCOUNT.ADDED_REFERENCE,
    referenceEmail: input.referenceEmail
  };

  expect(updatedVolunteer.references[0]).toMatchObject(expectedReference);
  expect(updatedVolunteer.references.length).toEqual(1);
  expect(userAction).toMatchObject(expectedUserAction);
});

test('Should delete a reference', async () => {
  const referenceOne = buildReference();
  const referenceTwo = buildReference();
  const references = [referenceOne, referenceTwo];
  const volunteer = buildVolunteer({ references });
  await insertVolunteer(volunteer);

  const { _id: userId } = volunteer;
  const input = {
    userId,
    referenceEmail: referenceOne.email
  };

  await UserService.deleteReference(input);

  const updatedVolunteer: Partial<Volunteer> = await VolunteerModel.findOne({
    _id: userId
  })
    .select('references')
    .lean()
    .exec();
  const userAction = await UserActionModel.findOne({
    user: userId,
    action: USER_ACTION.ACCOUNT.DELETED_REFERENCE
  });

  const remainingReference = {
    firstName: referenceTwo.firstName,
    lastName: referenceTwo.lastName,
    email: referenceTwo.email,
    status: REFERENCE_STATUS.UNSENT
  };
  const removedReference = {
    firstName: referenceOne.firstName,
    lastName: referenceOne.lastName,
    email: referenceOne.email
  };
  const expectedUserAction = {
    user: userId,
    action: USER_ACTION.ACCOUNT.DELETED_REFERENCE,
    referenceEmail: input.referenceEmail
  };

  expect(updatedVolunteer.references.length).toEqual(1);
  expect(updatedVolunteer.references).not.toContainEqual(
    expect.objectContaining({ ...removedReference })
  );
  expect(updatedVolunteer.references[0]).toMatchObject(remainingReference);
  expect(userAction).toMatchObject(expectedUserAction);
});

test('Should save reference form data', async () => {
  const reference = buildReference();
  const references = [reference];
  const volunteer = buildVolunteer({ references });
  await insertVolunteer(volunteer);
  const { _id: userId } = volunteer;

  const referenceFormInput = {
    userId,
    referenceId: reference._id,
    referenceFormData: buildReferenceForm(),
    referenceEmail: reference.email
  };

  await UserService.saveReferenceForm(referenceFormInput);

  const {
    references: updatedReferences
  }: Partial<Volunteer> = await VolunteerModel.findOne({
    _id: userId
  })
    .select('references')
    .lean()
    .exec();
  const userAction = await UserActionModel.findOne({
    user: userId,
    action: USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM
  });

  const [updatedReference] = updatedReferences;
  const expectedUserAction = {
    user: userId,
    action: USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM,
    referenceEmail: referenceFormInput.referenceEmail
  };

  expect(updatedReference).toMatchObject(referenceFormInput.referenceFormData);
  expect(userAction).toMatchObject(expectedUserAction);
});

test.todo('Admin should get pending volunteers');

test('Pending volunteer should not be approved after being rejected', async () => {
  const references = [buildReferenceWithForm(), buildReferenceWithForm()];
  const options = {
    references,
    ...buildPhotoIdData()
  };
  const volunteer = buildVolunteer(options);
  await insertVolunteer(volunteer);
  const input = {
    volunteerId: volunteer._id,
    photoIdStatus: PHOTO_ID_STATUS.REJECTED,
    referencesStatus: [REFERENCE_STATUS.APPROVED, REFERENCE_STATUS.REJECTED]
  };

  await UserService.updatePendingVolunteerStatus(input);
  const updatedVolunteer = await VolunteerModel.findOne({ _id: volunteer._id })
    .lean()
    .select('photoIdStatus references.status isApproved')
    .exec();
  const accountApprovedUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  });
  const rejectedReferenceUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.REJECTED_REFERENCE
  });
  const rejectedPhotoIdUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.REJECTED_PHOTO_ID
  });

  const expectedVolunteer = {
    photoIdStatus: input.photoIdStatus,
    references: [
      { status: input.referencesStatus[0] },
      { status: input.referencesStatus[1] }
    ],
    isApproved: false
  };
  const expectedRejectedReferenceUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.REJECTED_REFERENCE,
    referenceEmail: references[1].email
  };
  const expectedRejectedPhotoIdUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.REJECTED_PHOTO_ID
  };

  expect(updatedVolunteer).toMatchObject(expectedVolunteer);
  expect(accountApprovedUserAction).toBeNull();
  expect(rejectedReferenceUserAction).toMatchObject(
    expectedRejectedReferenceUserAction
  );
  expect(rejectedPhotoIdUserAction).toMatchObject(
    expectedRejectedPhotoIdUserAction
  );
});

test('Pending volunteer should be approved after approval', async () => {
  const options = {
    references: [buildReferenceWithForm(), buildReferenceWithForm()],
    ...buildPhotoIdData(),
    ...buildBackgroundInfo()
  };
  const volunteer = buildVolunteer(options);
  await insertVolunteer(volunteer);
  const input = {
    volunteerId: volunteer._id,
    photoIdStatus: PHOTO_ID_STATUS.APPROVED,
    referencesStatus: [REFERENCE_STATUS.APPROVED, REFERENCE_STATUS.APPROVED]
  };

  await UserService.updatePendingVolunteerStatus(input);
  const updatedVolunteer = await VolunteerModel.findOne({ _id: volunteer._id })
    .lean()
    .select('photoIdStatus references.status isApproved')
    .exec();
  const userAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  });

  const expectedVolunteer = {
    photoIdStatus: input.photoIdStatus,
    references: [
      { status: input.referencesStatus[0] },
      { status: input.referencesStatus[1] }
    ],
    isApproved: true
  };
  const expectedUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  };

  expect(updatedVolunteer).toMatchObject(expectedVolunteer);
  expect(userAction).toMatchObject(expectedUserAction);
});

test('Open volunteer is not approved when submitting their background info', async () => {
  const volunteer = buildVolunteer({
    references: [
      buildReference({ status: STATUS.APPROVED }),
      buildReference({ status: STATUS.APPROVED })
    ],
    photoIdStatus: STATUS.APPROVED
  });
  await insertVolunteer(volunteer);

  const update = buildBackgroundInfo();
  const input = {
    volunteerId: volunteer._id,
    update
  };

  await UserService.addBackgroundInfo(input);
  const updatedVolunteer = await VolunteerModel.findOne({ _id: volunteer._id })
    .lean()
    .select('isApproved')
    .exec();
  const backgroundInfoUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
  });
  const accountApprovedUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  });

  const expectedVolunteer = {
    isApproved: false
  };
  const expectedBackgroundInfoUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
  };

  expect(updatedVolunteer).toMatchObject(expectedVolunteer);
  expect(backgroundInfoUserAction).toMatchObject(
    expectedBackgroundInfoUserAction
  );
  expect(accountApprovedUserAction).toBeNull();
});

test('Partner volunteer is approved when submitting background info', async () => {
  const volunteer = buildVolunteer({
    references: [
      buildReference({ status: STATUS.APPROVED }),
      buildReference({ status: STATUS.APPROVED })
    ],
    photoIdStatus: STATUS.APPROVED,
    volunteerPartnerOrg: 'example'
  });
  await insertVolunteer(volunteer);

  const update = buildBackgroundInfo({ languages: [] });
  const input = {
    volunteerId: volunteer._id,
    update
  };

  await UserService.addBackgroundInfo(input);
  const updatedVolunteer = await VolunteerModel.findOne({ _id: volunteer._id })
    .lean()
    .select(
      'isApproved occupation experience background languages country state city'
    )
    .exec();
  const backgroundInfoUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
  });
  const accountApprovedUserAction = await UserActionModel.findOne({
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  });

  const expectedVolunteer = {
    isApproved: true,
    occupation: update.occupation,
    experience: update.experience,
    background: update.background,
    country: update.country,
    state: update.state,
    city: update.city,
    // @note: UserService.addBackgroundInfo manipulates `update` and removes a property if
    //        it contains an empty string or empty array
    languages: []
  };
  const expectedBackgroundInfoUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
  };
  const expectedAccountApprovedUserAction = {
    user: input.volunteerId,
    action: USER_ACTION.ACCOUNT.APPROVED
  };

  expect(updatedVolunteer).toMatchObject(expectedVolunteer);
  expect(backgroundInfoUserAction).toMatchObject(
    expectedBackgroundInfoUserAction
  );
  expect(accountApprovedUserAction).toMatchObject(
    expectedAccountApprovedUserAction
  );
});
