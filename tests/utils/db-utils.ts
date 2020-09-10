import bcrypt from 'bcrypt';
import UserModel from '../../models/User';
import VolunteerModel from '../../models/Volunteer';
import StudentModel from '../../models/Student';
import UserActionModel from '../../models/UserAction';
import SessionModel from '../../models/Session';
import config from '../../config';
import { Volunteer, Student, Session } from './types';
import { buildVolunteer, buildStudent, buildSession } from './generate';

const hashPassword = async function(password): Promise<Error | string> {
  try {
    const salt = await bcrypt.genSalt(config.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(error);
  }
};

export const resetDb = async (): Promise<void> => {
  await UserModel.remove({});
  await UserActionModel.remove({});
};

export const insertVolunteer = async (
  volunteer = buildVolunteer()
): Promise<Volunteer> => {
  const hashedPassword = await hashPassword(volunteer.password);
  const createdVolunteer = await VolunteerModel.create({
    ...volunteer,
    password: hashedPassword
  });
  // Return volunteer with non-hashed password
  return { ...createdVolunteer.toObject(), password: volunteer.password };
};

export const insertStudent = async (
  student = buildStudent()
): Promise<Student> => {
  const hashedPassword = await hashPassword(student.password);
  const createdStudent = await StudentModel.create({
    ...student,
    password: hashedPassword
  });
  // Return student with non-hashed password
  return { ...createdStudent.toObject(), password: student.password };
};

// @todo: make the student configurable
export const insertSession = async (
  overrides = {}
): Promise<{
  session: Session;
  student: Student;
}> => {
  const student = await insertStudent();
  const session = buildSession({
    student: student._id,
    ...overrides
  });
  const createdSession = await SessionModel.create(session);
  // Return the session and the student
  return { session: createdSession.toObject(), student };
};

// @todo: make the student configurable
export const insertSessionWithVolunteer = async (
  overrides = {}
): Promise<{
  session: Session;
  student: Student;
  volunteer: Volunteer;
}> => {
  const student = await insertStudent();
  const volunteer = await insertVolunteer();
  const session = buildSession({
    student: student._id,
    volunteer: volunteer._id,
    volunteerJoinedAt: new Date(),
    ...overrides
  });
  const createdSession = await SessionModel.create(session);
  // Return the session and the student
  return { session: createdSession.toObject(), student, volunteer };
};
