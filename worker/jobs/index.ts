import { ProcessPromiseFunction, Queue } from 'bull';
import { log } from '../logger';
import { map } from 'lodash';
import notifyTutors from './notifyTutors';
import updateElapsedAvailability from './updateElapsedAvailability';

export enum Jobs {
  NotifyTutors = 'NotifyTutors',
  UpdateElapsedAvailability = 'UpdateElapsedAvailability'
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
        log(error)
      }
    })
  );
};
