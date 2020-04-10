import * as Queue from 'bull';
import { log } from './logger';

const queueName = 'main';
const redisConnectionString = 'redis://127.0.0.1:6379';

const main = async () => {
  try {
    log('Starting queue');
    const queue = new Queue(queueName, redisConnectionString);
    await queue.process(async job => {
      log(JSON.stringify(job));
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`Could not connect to redis server: ${redisConnectionString}`);
    }
  }
};

main();
