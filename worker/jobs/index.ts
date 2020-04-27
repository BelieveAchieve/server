import { ProcessPromiseFunction, Queue } from 'bull';
import { map } from 'lodash';
import { log } from '../logger';
import updateElapsedAvailability from './updateElapsedAvailability';

export enum Jobs {
  UpdateElapsedAvailability = 'UpdateElapsedAvailability'
}

// register new job processors here
interface JobProcessor {
  name: Jobs;
  processor: ProcessPromiseFunction<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const jobProcessors: JobProcessor[] = [
  {
    name: Jobs.UpdateElapsedAvailability,
    processor: updateElapsedAvailability
  }
];

export const addJobProcessors = (queue: Queue): void => {
  map(jobProcessors, jobProcessor =>
    queue.process(jobProcessor.name, async job => {
      log(`Processing job: ${job.name}`);
      await jobProcessor.processor(job);
      log(`Completed job: ${job.name}`);
    })
  );
};
