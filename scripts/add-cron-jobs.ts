import * as Queue from 'bull';
import { find, map } from 'lodash';
import { workerQueueName, redisConnectionString } from '../config';
import { log } from '../worker/logger';
import { Jobs } from '../worker/jobs';

interface JobTemplate {
  name: Jobs;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  options?: Queue.JobOptions;
}

const jobTemplates: JobTemplate[] = [
  {
    name: Jobs.UpdateElapsedAvailability,
    // options: { repeat: { cron: '0 4 * * *', tz: 'America/New_York' } },
    options: { repeat: { cron: '0 4 * * *', tz: 'America/New_York' } }
  }
];

const main = async (): Promise<void> => {
  try {
    const queue = new Queue(workerQueueName, redisConnectionString);

    const repeatableJobs = await queue.getRepeatableJobs();

    await Promise.all(
      map(repeatableJobs, async job => {
        if (find(jobTemplates, template => template.name === job.name)) {
          log(`Stopping jobs: \n${JSON.stringify(job, null, ' ')}`);
          await queue.removeRepeatableByKey(job.key);
        }
      })
    );

    log(`Starting jobs: \n${JSON.stringify(jobTemplates, null, ' ')}`);
    await Promise.all(
      map(jobTemplates, job => queue.add(job.name, job.data, job.options))
    );

    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

main();
