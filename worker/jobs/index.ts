import { ProcessPromiseFunction, Queue } from 'bull';
import { log } from '../logger';
import { map } from 'lodash';
import updateElapsedAvailability from './updateElapsedAvailability';

export enum Jobs {
  UpdateElapsedAvailability = 'UpdateElapsedAvailability',
}

// register new job processors here
interface JobProcessor {
  name: Jobs;
  processor: ProcessPromiseFunction<any>;
}

const jobProcessors: JobProcessor[] = [
  {
    name: Jobs.UpdateElapsedAvailability,
    processor: updateElapsedAvailability,
  },
];

export const addJobProcessors = (queue: Queue) => {
  map(jobProcessors, jobProcessor =>
    queue.process(jobProcessor.name, async job => {
      log(`Processing job: ${job.name}`);
      await jobProcessor.processor(job);
      log(`Completed job: ${job.name}`);
    }),
  );
};
