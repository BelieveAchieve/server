import mongoose from 'mongoose';
import request, { Test } from 'supertest';
import Student from '../../../models/Student';
import app from '../../../app';
import School from '../../../models/School';
import testHighSchools from '../../../seeds/schools/test_high_schools.json';
import UserAction from '../../../models/UserAction';
import { USER_ACTION } from '../../../constants';
jest.mock('../../../services/MailService');

// @todo: use the Student interface from Student.ts when available
interface Student {
  email: string;
  firstName: string;
  highSchoolId: string;
  lastName: string;
  password: string;
  zipCode: string;
  studentPartnerOrg: string;
  referredByCode: string;
  terms?: boolean; // @todo - terms is not part of a student
}

const US_IP_ADDRESS = '161.185.160.93';

const registerStudent = (student: Student): Test =>
  request(app)
    .post('/auth/register/student')
    .set('X-Forwarded-For', US_IP_ADDRESS)
    .set('Accept', 'application/json')
    .send(student);

const createStudent = (options: Partial<Student> = {}): Student => {
  const student = {
    email: 'student1@upchieve.org',
    firstName: 'Student',
    highSchoolId: '23456789',
    lastName: 'UPchieve',
    password: 'Password123',
    terms: true,
    zipCode: '11201',
    studentPartnerOrg: 'example',
    referredByCode: ''
  };

  return Object.assign(student, options);
};

// db connection
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  });
  School.insertMany(testHighSchools);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Register student tests
test('Student did not agree with the terms', async () => {
  const studentOptions = { terms: false };
  const newStudent = createStudent(studentOptions);

  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage = 'Must accept the user agreement';

  expect(err).toEqual(expectedErrorMessage);
});

test('Student did not provide an email', async () => {
  const studentOptions = { email: '' };
  const newStudent = createStudent(studentOptions);

  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage =
    'Must supply an email and password for registration';

  expect(err).toEqual(expectedErrorMessage);
});

test('Student did not provide a password', async () => {
  const studentOptions = { password: '' };
  const newStudent = createStudent(studentOptions);

  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage =
    'Must supply an email and password for registration';

  expect(err).toEqual(expectedErrorMessage);
});

test('Student did not provide a sufficient password', async () => {
  const studentOptions = { password: 'password' };
  const newStudent = createStudent(studentOptions);
  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage =
    'Password must contain at least one uppercase letter';

  expect(err).toEqual(expectedErrorMessage);
});

test('Student is not with a valid student partner organization', async () => {
  const studentOptions = {
    highSchoolId: '',
    zipCode: '',
    studentPartnerOrg: 'invalid'
  };
  const newStudent = createStudent(studentOptions);
  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage = 'Invalid student partner organization';

  expect(err).toEqual(expectedErrorMessage);
});

test('Student registers with a highschool that is not approved and no partner org', async () => {
  const studentOptions = {
    highSchoolId: '12345678',
    zipCode: '',
    studentPartnerOrg: ''
  };
  const newStudent = createStudent(studentOptions);
  const response = await registerStudent(newStudent).expect(422);

  const {
    body: { err }
  } = response;

  const expectedErrorMessage = `School ${studentOptions.highSchoolId} is not approved`;

  expect(err).toEqual(expectedErrorMessage);
});

describe('Successful student registration', () => {
  beforeEach(async () => {
    await Student.remove({});
  });

  test('Create a student from outside the US', async () => {
    const canadianIpAddress = '162.219.162.233';
    const newStudent = createStudent();
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
    // Create the first student
    const newStudentOne = createStudent();
    const studentOneResponse = await registerStudent(newStudentOne).expect(200);

    const {
      body: { user: studentOne }
    } = studentOneResponse;
    const studentOneReferralCode = studentOne.referralCode;
    const studentOneId = studentOne._id;

    // Create the second student
    const studentTwoOptions = {
      email: 'student2@upchieve.org',
      referredByCode: studentOneReferralCode
    };
    const newStudentTwo = createStudent(studentTwoOptions);
    const studentTwoResponse = await registerStudent(newStudentTwo).expect(200);

    const {
      body: { user: studentTwo }
    } = studentTwoResponse;

    const result = studentTwo.referredBy;
    const expected = studentOneId;

    expect(result).toEqual(expected);
  });

  test('Student registered with a student partner org', async () => {
    const studentOptions = {
      highSchoolId: '',
      zipCode: '',
      studentPartnerOrg: 'example'
    };
    const newStudent = createStudent(studentOptions);
    const response = await registerStudent(newStudent).expect(200);

    const {
      body: { user }
    } = response;

    const expectedStudentPartnerOrg = 'example';
    const result = user.studentPartnerOrg;

    expect(result).toEqual(expectedStudentPartnerOrg);
  });

  test('User action account created was created', async () => {
    const newStudent = createStudent();
    const response = await registerStudent(newStudent).expect(200);

    const {
      body: { user }
    } = response;
    const { _id } = user;

    const userAction = await UserAction.findOne({ user: _id });

    const result = userAction.action;
    const expected = USER_ACTION.ACCOUNT.CREATED;

    expect(result).toEqual(expected);
  });

  test.todo('Test if MailService was invoked');
});
