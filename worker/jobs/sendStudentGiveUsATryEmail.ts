import * as Sentry from '@sentry/node';
import { size } from 'lodash';
import * as UserModel from '../../models/User';
import * as MailService from '../../services/MailService';
import { User } from '../../models/types';
import * as dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';

export default async (): Promise<void> => {
  try {
    await dbconnect();
    const students = (await UserModel.find({ isVolunteer: false })
      .lean()
      .exec()) as User[];

    for (const student of students) {
      const { createdAt } = student;
      const studentCreatedAtInMS: number = new Date(createdAt).getTime();
      const todaysDateInMS: number = new Date().getTime();
      const fourDays: number = 1000 * 60 * 60 * 24 * 4;
      const threeDays: number = 1000 * 60 * 60 * 24 * 3;

      if (
        studentCreatedAtInMS <= todaysDateInMS - threeDays &&
        studentCreatedAtInMS >= todaysDateInMS - fourDays &&
        student.pastSessions.length === 0
      ) {
        const { firstname: firstName, email } = student;
        MailService.sendStudentGiveUsATryEmail({ firstName, email });
      }
    }
    log(`updated ${size(students)} students`);
  } catch (error) {
    log(error);
    Sentry.captureException(error);
  }
};
