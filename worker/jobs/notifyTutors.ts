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
  try {
    const volunteerNotified = await TwilioService.notifyVolunteer(session);
    if (volunteerNotified) log(`Volunteer notified: ${volunteerNotified._id}`);
    else log('No volunteer notified');
  } catch (error) {
    log(error)
  }
};
