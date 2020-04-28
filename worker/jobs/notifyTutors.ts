import { Job } from 'bull';
import * as Session from '../../models/Session';
import * as SessionService from '../../services/SessionService';
import * as TwilioService from '../../services/twilio';
import * as dbconnect from '../../dbutils/dbconnect';
import { Jobs } from '.';
import { log } from '../logger';

interface NotifyTutorsJobData {
  sessionId: string;
  notificationSchedule: number[];
}

export default async (job: Job<NotifyTutorsJobData>): Promise<void> => {
  const { sessionId, notificationSchedule } = job.data;
  await dbconnect();
  const session = await Session.findById(sessionId);
  if (!session) return log(`session ${sessionId} not found`);
  const fulfilled = SessionService.isSessionFulfilled(session);
  if (fulfilled) return;
  const delay = notificationSchedule.shift();
  if (delay)
    job.queue.add(
      Jobs.NotifyTutors,
      { sessionId, notificationSchedule },
      { delay }
    );
  const numNotified = await TwilioService.notifyRegular(session);
  log(`${numNotified} tutors notified`);
};
