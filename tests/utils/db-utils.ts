import bcrypt from 'bcrypt';
import UserModel from '../../models/User';
import VolunteerModel, { Volunteer } from '../../models/Volunteer';
import StudentModel, { Student } from '../../models/Student';
import UserActionModel from '../../models/UserAction';
import config from '../../config';
import { buildVolunteer, buildStudent } from './generate';

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
