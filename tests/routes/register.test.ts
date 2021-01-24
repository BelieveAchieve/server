import mongoose from 'mongoose';
import request, { Test } from 'supertest';
import { StudentRegistrationForm, VolunteerRegistrationForm } from '../types';
import app from '../../app';
import School from '../../models/School';
import testHighSchools from '../../seeds/schools/test_high_schools.json';
import {
  buildStudentRegistrationForm,
  buildVolunteerRegistrationForm,
  buildStudent
} from '../generate';
import { resetDb, insertStudent } from '../db-utils';
import {
  createContact,
  sendStudentWelcomeEmail
} from '../../services/MailService';
import { initiateVerification } from '../../controllers/VerificationCtrl';
import { createdAccount } from '../../controllers/UserActionCtrl';
jest.mock('../../services/MailService');
jest.mock('../../controllers/VerificationCtrl');
jest.mock('../../controllers/UserActionCtrl');

const US_IP_ADDRESS = '161.185.160.93';

const registerStudent = (form: StudentRegistrationForm): Test =>
  request(app)
    .post('/auth/register/student')
    .set('X-Forwarded-For', US_IP_ADDRESS)
    .set('Accept', 'application/json')
    .send(form);

const registerOpenVolunteer = (form: VolunteerRegistrationForm): Test =>
  request(app)
    .post('/auth/register/volunteer/open')
    .set('X-Forwarded-For', US_IP_ADDRESS)
    .set('Accept', 'application/json')
    .send(form);

const registerPartnerVolunteer = (form: VolunteerRegistrationForm): Test =>
  request(app)
    .post('/auth/register/volunteer/partner')
    .set('X-Forwarded-For', US_IP_ADDRESS)
    .set('Accept', 'application/json')
    .send(form);

// db connection
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Student registration', () => {
  beforeAll(async () => {
    School.insertMany(testHighSchools);
  });

  test('Student did not agree with the terms', async () => {
    const formOptions = { terms: false };
    const newStudent = buildStudentRegistrationForm(formOptions);

    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = 'Must accept the user agreement';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Student did not provide an email', async () => {
    const formOptions = { email: '' };
    const newStudent = buildStudentRegistrationForm(formOptions);

    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Student did not provide a password', async () => {
    const formOptions = { password: '' };
    const newStudent = buildStudentRegistrationForm(formOptions);

    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Student did not provide a sufficient password', async () => {
    const formOptions = { password: 'password' };
    const newStudent = buildStudentRegistrationForm(formOptions);
    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Password must contain at least one uppercase letter';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Student is not with a valid student partner organization', async () => {
    const formOptions = {
      highSchoolId: '',
      zipCode: '',
      studentPartnerOrg: 'invalid'
    };
    const newStudent = buildStudentRegistrationForm(formOptions);
    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = 'Invalid student partner organization';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Student registers with a highschool that is not approved and no partner org', async () => {
    const formOptions = {
      highSchoolId: '12345678',
      zipCode: '',
      studentPartnerOrg: ''
    };
    const newStudent = buildStudentRegistrationForm(formOptions);
    const response = await registerStudent(newStudent).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = `School ${formOptions.highSchoolId} is not approved`;

    expect(err).toEqual(expectedErrorMessage);
  });

  describe('Successful student registration', () => {
    beforeEach(async () => {
      await resetDb();
      jest.clearAllMocks();
    });

    test('Create a student from outside the US', async () => {
      const canadianIpAddress = '162.219.162.233';
      const newStudent = buildStudentRegistrationForm();
      const response = await registerStudent(newStudent)
        .set('X-Forwarded-For', canadianIpAddress)
        .expect(200);

      const {
        body: { user }
      } = response;
      const expectedBannedStatus = {
        isBanned: true,
        banReason: 'NON US SIGNUP'
      };

      expect(user).toMatchObject(expectedBannedStatus);
    });

    test('Student was referred from another student', async () => {
      const studentOne = buildStudent();
      await insertStudent(studentOne);

      const studentOneReferralCode = studentOne.referralCode;
      const studentOneId = studentOne._id;

      // Create the second student
      const formOptions = {
        referredByCode: studentOneReferralCode
      };
      const newStudentRegistationForm = buildStudentRegistrationForm(
        formOptions
      );
      const response = await registerStudent(newStudentRegistationForm).expect(
        200
      );

      const {
        body: { user: studentTwo }
      } = response;

      const expected = studentOneId;
      expect(studentTwo.referredBy.toString()).toEqual(expected.toString());
      expect((sendStudentWelcomeEmail as jest.Mock).mock.calls.length).toBe(1);
      expect((createContact as jest.Mock).mock.calls.length).toBe(1);
      expect((createdAccount as jest.Mock).mock.calls.length).toBe(1);
    });

    test('Student registered with a student partner org', async () => {
      const formOptions = {
        highSchoolId: '',
        zipCode: '',
        studentPartnerOrg: 'example'
      };
      const newStudent = buildStudentRegistrationForm(formOptions);
      const response = await registerStudent(newStudent).expect(200);

      const {
        body: { user }
      } = response;

      const expectedStudentPartnerOrg = 'example';
      const result = user.studentPartnerOrg;

      expect(result).toEqual(expectedStudentPartnerOrg);
      expect((sendStudentWelcomeEmail as jest.Mock).mock.calls.length).toBe(1);
      expect((createContact as jest.Mock).mock.calls.length).toBe(1);
      expect((createdAccount as jest.Mock).mock.calls.length).toBe(1);
    });
  });
});

describe('Open volunteer registration', () => {
  test('Open volunteer did not agree with the terms', async () => {
    const formOptions = { terms: false };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerOpenVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = 'Must accept the user agreement';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Open volunteer did not provide an email', async () => {
    const formOptions = { email: '' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerOpenVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Open volunteer did not provide a password', async () => {
    const formOptions = { password: '' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerOpenVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Open volunteer did not provide a sufficient password', async () => {
    const formOptions = { password: 'password' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);
    const response = await registerOpenVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Password must contain at least one uppercase letter';

    expect(err).toEqual(expectedErrorMessage);
  });

  describe('Successful open volunteer registration', () => {
    beforeEach(async () => {
      await resetDb();
      jest.clearAllMocks();
    });

    test('Open volunteer creates a new account', async () => {
      const newVolunteer = buildVolunteerRegistrationForm();
      const response = await registerOpenVolunteer(newVolunteer).expect(200);

      const {
        body: { user }
      } = response;

      const expectedFirstName = newVolunteer.firstName;
      const expectedEmail = newVolunteer.email;

      expect(user.firstname).toEqual(expectedFirstName);
      expect(user.email).toEqual(expectedEmail);
      expect(user.isApproved).toBeFalsy();
      expect((initiateVerification as jest.Mock).mock.calls.length).toBe(1);
      expect((createContact as jest.Mock).mock.calls.length).toBe(1);
      expect((createdAccount as jest.Mock).mock.calls.length).toBe(1);
    });
  });
});

describe('Partner volunteer registration', () => {
  test('Partner volunteer did not agree with the terms', async () => {
    const formOptions = { terms: false };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = 'Must accept the user agreement';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Partner volunteer did not provide an email', async () => {
    const formOptions = { email: '' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Partner volunteer did not provide a password', async () => {
    const formOptions = { password: '' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);

    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Must supply an email and password for registration';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Partner volunteer did not provide a sufficient password', async () => {
    const formOptions = { password: 'password' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);
    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Password must contain at least one uppercase letter';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Partner volunteer did not provide a valid partner organization', async () => {
    const formOptions = { volunteerPartnerOrg: '' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);
    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage = 'Invalid volunteer partner organization';

    expect(err).toEqual(expectedErrorMessage);
  });

  test('Partner volunteer did not provide a valid partner organization email', async () => {
    const formOptions = { volunteerPartnerOrg: 'example2' };
    const newVolunteer = buildVolunteerRegistrationForm(formOptions);
    const response = await registerPartnerVolunteer(newVolunteer).expect(422);

    const {
      body: { err }
    } = response;

    const expectedErrorMessage =
      'Invalid email domain for volunteer partner organization';

    expect(err).toEqual(expectedErrorMessage);
  });

  describe('Successful partner volunteer registration', () => {
    beforeEach(async () => {
      await resetDb();
      jest.clearAllMocks();
    });

    test('Partner volunteer creates a new account', async () => {
      const formOptions = {
        volunteerPartnerOrg: 'example',
        email: 'volunteer1@example.com'
      };
      const newVolunteer = buildVolunteerRegistrationForm(formOptions);
      const response = await registerPartnerVolunteer(newVolunteer).expect(200);

      const {
        body: { user }
      } = response;

      const expectedFirstName = newVolunteer.firstName;
      const expectedEmail = newVolunteer.email;

      expect(user.firstname).toEqual(expectedFirstName);
      expect(user.email).toEqual(expectedEmail);
      expect(user.isApproved).toBeFalsy();
      expect((initiateVerification as jest.Mock).mock.calls.length).toBe(1);
      expect((createContact as jest.Mock).mock.calls.length).toBe(1);
      expect((createdAccount as jest.Mock).mock.calls.length).toBe(1);
    });
  });
});
