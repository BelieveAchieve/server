import { Document } from 'mongoose';
import bcrypt from 'bcrypt';
import UserModel from '../../models/User';
import VolunteerModel from '../../models/Volunteer';
import StudentModel from '../../models/Student';
import config from '../../config';

const hashPassword = async function(password): Promise<Error | string> {
  try {
    const salt = await bcrypt.genSalt(config.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new error(error);
  }
};

export const resetDb = async (): Promise<void> => {
  await UserModel.remove({});
};

export const insertVolunteer = async (volunteer): Promise<Document> => {
  const hashedPassword = await hashPassword(volunteer.password);
  return VolunteerModel.create({ ...volunteer, password: hashedPassword });
};

export const insertStudent = async (student): Promise<Document> => {
  const hashedPassword = await hashPassword(student.password);
  return StudentModel.create({ ...student, password: hashedPassword });
};
