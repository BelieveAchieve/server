import { ProcessPromiseFunction, Queue } from 'bull';
import { map } from 'lodash';
import * as Sentry from '@sentry/node';
import { log } from '../logger';
import notifyTutors from './notifyTutors';
import updateElapsedAvailability from './updateElapsedAvailability';
import endStaleSessions from './endStaleSessions';
import emailReferences from './emailReferences';
import emailReadyToCoach from './emailReadyToCoach';

export enum Jobs {
  NotifyTutors = 'NotifyTutors',
  UpdateElapsedAvailability = 'UpdateElapsedAvailability',
  EndStaleSessions = 'EndStaleSessions',
  EmailReferences = 'EmailReferences',
  EmailReadyToCoach = 'EmailReadyToCoach'
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
    name: Jobs.EmailReferences,
    processor: emailReferences
  },
  {
    name: Jobs.EmailReadyToCoach,
    processor: emailReadyToCoach
  }
];

export const addJobProcessors = (queue: Queue): void => {
  map(jobProcessors, jobProcessor =>
    queue.process(jobProcessor.name, async job => {
      log(`Processing job: ${job.name}`);
      try {
        await jobProcessor.processor(job);
        log(`Completed job: ${job.name}`);
      } catch (error) {
        log(`Error processing job: ${job.name}`);
        log(error);
        Sentry.captureException(error);
      }
    })
  );
};
