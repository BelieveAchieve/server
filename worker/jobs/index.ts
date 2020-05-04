import { ProcessPromiseFunction, Queue } from 'bull';
import { map } from 'lodash';
import { log } from '../logger';
import notifyTutors from './notifyTutors';
import updateElapsedAvailability from './updateElapsedAvailability';
import sendFinishOnboardingEmail from './sendFinishOnboardingEmail';

export enum Jobs {
  NotifyTutors = 'NotifyTutors',
  UpdateElapsedAvailability = 'UpdateElapsedAvailability',
  SendFinishOnboardingEmail = 'SendFinishOnboardingEmail'
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
    name: Jobs.SendFinishOnboardingEmail,
    processor: sendFinishOnboardingEmail
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
      }
    })
  );
};
