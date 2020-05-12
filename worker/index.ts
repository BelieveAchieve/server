import Queue from 'bull';
import config from '../config';
import { log } from './logger';
import { addJobProcessors } from './jobs';

const main = async (): Promise<void> => {
  try {
    log('Starting queue');
    const queue = new Queue(
      config.workerQueueName,
      config.redisConnectionString,
      {
        settings: {
          // to prevent stalling long jobs
          stalledInterval: 1000 * 60 * 10,
          lockDuration: 1000 * 60 * 10
        }
      }
    );
    addJobProcessors(queue);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`Could not connect to redis server: ${config.redisConnectionString}`);
    }
  }
};

main();
