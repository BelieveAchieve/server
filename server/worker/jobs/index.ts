import { ProcessPromiseFunction, Queue } from 'bull';
import { map } from 'lodash';
import * as Sentry from '@sentry/node';
import newrelic from 'newrelic';
import { log } from '../logger';
import notifyTutors from './notifyTutors';
import updateElapsedAvailability from './updateElapsedAvailability';
import endStaleSessions from './endStaleSessions';
import endUnmatchedSession from './endUnmatchedSession';
import emailReferences from './emailReferences';
import emailReadyToCoach from './emailReadyToCoach';
import emailReferenceFollowup from './emailReferenceFollowup';
import emailWaitingOnReferences from './emailWaitingOnReferences';
import emailNiceToMeetYou from './emailNiceToMeetYou';
import emailWeeklyHourSummary from './emailWeeklyHourSummary';

export enum Jobs {
  NotifyTutors = 'NotifyTutors',
  UpdateElapsedAvailability = 'UpdateElapsedAvailability',
  EndStaleSessions = 'EndStaleSessions',
  EndUnmatchedSession = 'EndUnmatchedSession',
  EmailReferences = 'EmailReferences',
  EmailReadyToCoach = 'EmailReadyToCoach',
  EmailReferenceFollowup = 'EmailReferenceFollowup',
  EmailWaitingOnReferences = 'emailWaitingOnReferences',
  EmailNiceToMeetYou = 'emailNiceToMeetYou',
  EmailWeeklyHourSummary = 'emailWeeklyHourSummary'
}

// register new job processors here
interface JobProcessor {
  name: Jobs;
  processor: ProcessPromiseFunction<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const jobProcessors: JobProcessor[] = [
  {
    name: Jobs.NotifyTutors,
    processor: notifyTutors
  },
  {
    name: Jobs.UpdateElapsedAvailability,
    processor: updateElapsedAvailability
  },
  {
    name: Jobs.EndStaleSessions,
    processor: endStaleSessions
  },
  {
    name: Jobs.EndUnmatchedSession,
    processor: endUnmatchedSession
  },
  {
    name: Jobs.EmailReferences,
    processor: emailReferences
  },
  {
    name: Jobs.EmailReadyToCoach,
    processor: emailReadyToCoach
  },
  {
    name: Jobs.EmailReferenceFollowup,
    processor: emailReferenceFollowup
  },
  {
    name: Jobs.EmailWaitingOnReferences,
    processor: emailWaitingOnReferences
  },
  {
    name: Jobs.EmailNiceToMeetYou,
    processor: emailNiceToMeetYou
  },
  {
    name: Jobs.EmailWeeklyHourSummary,
    processor: emailWeeklyHourSummary
  }
];

export const addJobProcessors = (queue: Queue): void => {
  map(jobProcessors, jobProcessor =>
    queue.process(jobProcessor.name, job => {
      newrelic.startBackgroundTransaction(`job:${job.name}`, async () => {
        const transaction = newrelic.getTransaction();
        log(`Processing job: ${job.name}`);
        try {
          await jobProcessor.processor(job);
          log(`Completed job: ${job.name}`);
        } catch (error) {
          log(`Error processing job: ${job.name}`);
          log(error);
          Sentry.captureException(error);
        } finally {
          transaction.end();
        }
      });
    })
  );
};
