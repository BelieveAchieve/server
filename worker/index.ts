import * as Queue from 'bull';
import { log } from './logger';
import { workerQueueName, redisConnectionString } from '../config';
import { addJobProcessors } from './jobs';

const main = async (): Promise<void> => {
  try {
    log('Starting queue');
    const queue = new Queue(workerQueueName, redisConnectionString, {
      settings: {
        stalledInterval: 1000 * 60 * 10,
        lockDuration: 1000 * 60 * 10
      }
    });
    addJobProcessors(queue);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`Could not connect to redis server: ${redisConnectionString}`);
    }
  }
};

main();
