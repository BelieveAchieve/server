import { Job } from 'bull';
import * as Session from '../../models/Session';
import { smsTimeout } from '../../config';
import * as SessionService from '../../services/SessionService';
import * as TwilioService from '../../services/twilio';
import * as dbconnect from '../../dbutils/dbconnect';
import { Jobs } from '.';
import { log } from '../logger';

interface NotifyTutorsJobData {
  sessionId: string;
}

export default async (job: Job<NotifyTutorsJobData>): Promise<void> => {
  await dbconnect();
  const { sessionId } = job.data;
  const session = await Session.findById(sessionId);
  if (!session) return log(`session ${sessionId} not found`);
  const fulfilled = SessionService.isSessionFulfilled(session);
  if (fulfilled) return;
  job.queue.add(Jobs.NotifyTutors, job.data, { delay: smsTimeout });
  const numNotified = await TwilioService.notifyRegular(session);
  log(`${numNotified} tutors notified`);
};
