import { Job } from 'bull';
import Session from '../../models/Session';
import SessionService from '../../services/SessionService';
import TwilioService from '../../services/twilio';
import { log } from '../logger';
import { Jobs } from '.';

interface NotifyTutorsJobData {
  sessionId: string;
  notificationSchedule: number[];
}

export default async (job: Job<NotifyTutorsJobData>): Promise<void> => {
  const { sessionId, notificationSchedule } = job.data;

  const session = await Session.findById(sessionId);
  if (!session) return log(`session ${sessionId} not found`);
  const fulfilled = SessionService.isSessionFulfilled(session);
  if (fulfilled)
    return log(`session ${sessionId} fulfilled, cancelling notifications`);
  const delay = notificationSchedule.shift();
  if (delay)
    job.queue.add(
      Jobs.NotifyTutors,
      { sessionId, notificationSchedule },
      { delay }
    );
  const volunteerNotified = await TwilioService.notifyVolunteer(session);
  if (volunteerNotified) log(`Volunteer notified: ${volunteerNotified._id}`);
  else log('No volunteer notified');
};
