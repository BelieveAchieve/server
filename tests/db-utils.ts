import bcrypt from 'bcrypt';
import UserModel from '../models/User';
import VolunteerModel, { Volunteer } from '../models/Volunteer';
import StudentModel, { Student } from '../models/Student';
import UserActionModel, { UserAction } from '../models/UserAction';
import SessionModel, { Session } from '../models/Session';
import NotificationModel from '../models/Notification';
import config from '../config';
import AvailabilitySnapshotModel, {
  AvailabilitySnapshot
} from '../models/Availability/Snapshot';
import AvailabilityHistoryModel, {
  AvailabilityHistory
} from '../models/Availability/History';
import {
  buildNotification,
  buildSession,
  buildStudent,
  buildVolunteer,
  buildAvailabilitySnapshot,
  buildAvailabilityHistory,
  buildUserAction
} from './generate';

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
  await NotificationModel.remove({});
  await SessionModel.remove({});
  await UserModel.remove({});
  await VolunteerModel.remove({});

  await UserActionModel.remove({});
};

export const insertVolunteer = async (
  overrides: Partial<Volunteer> = {}
): Promise<Volunteer> => {
  const volunteer = buildVolunteer(overrides);
  const hashedPassword = await hashPassword(volunteer.password);
  const createdVolunteer = await VolunteerModel.create({
    ...volunteer,
    password: hashedPassword
  });
  // Return volunteer with non-hashed password
  return { ...createdVolunteer.toObject(), password: volunteer.password };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const insertVolunteerMany = async (volunteers): Promise<any> => {
  // @note: Reasons for using collection.insertMany is because Mongoose casts each document in insertMany()
  // this bypasses the overhead and speeds up the test
  return VolunteerModel.collection.insertMany(volunteers);
};

export const insertStudent = async (
  overrides: Partial<Student> = {}
): Promise<Student> => {
  const student = buildStudent(overrides);
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

// @todo: make the student and volunteer configurable
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

export const insertNotification = async (
  volunteer = buildVolunteer(),
  overrides = {}
): Promise<{
  notification: Notification;
  volunteer: Partial<Volunteer>;
}> => {
  const notification = buildNotification({
    volunteer: volunteer._id,
    ...overrides
  });
  const createdNotification = await NotificationModel.create(notification);
  // Return the notification and the volunteer
  return { notification: createdNotification.toObject(), volunteer };
};

export const insertNotificationMany = async (
  notifications

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  return NotificationModel.collection.insertMany(notifications);
};

export const getStudent = (
  query,
  projection = {}
): Promise<Partial<Student>> => {
  return StudentModel.findOne(query)
    .select(projection)
    .lean()
    .exec();
};

export const getVolunteer = (
  query,
  projection = {}
): Promise<Partial<Volunteer>> => {
  return VolunteerModel.findOne(query)
    .select(projection)
    .lean()
    .exec();
};

export const getSession = (
  query,
  projection = {}
): Promise<Partial<Session>> => {
  return SessionModel.findOne(query)
    .select(projection)
    .lean()
    .exec();
};

export const insertAvailabilitySnapshot = async (
  overrides = {}
): Promise<AvailabilitySnapshot> => {
  const snapshot = buildAvailabilitySnapshot(overrides);
  const createdSnapshot = await AvailabilitySnapshotModel.create(snapshot);
  return { ...createdSnapshot.toObject() };
};

export const insertAvailabilityHistory = async (
  overrides: Partial<AvailabilityHistory> = {}
): Promise<AvailabilityHistory> => {
  const availabilityHistory = buildAvailabilityHistory(overrides);
  const createdAvailabilityHistory = await AvailabilityHistoryModel.create(
    availabilityHistory
  );
  return { ...createdAvailabilityHistory.toObject() };
};

export const insertUserAction = async (
  overrides: Partial<UserAction> = {}
): Promise<UserAction> => {
  const userAction = buildUserAction(overrides);
  const createdUserAction = await UserActionModel.create(userAction);
  return { ...createdUserAction.toObject() };
};
