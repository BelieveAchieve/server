import * as Queue from 'bull'
import { log } from './logger'
import { workerQueueName, redisConnectionString } from '../config'
import { addJobProcessors } from './jobs'

const main = async () => {
  try {
    log('Starting queue')
    const queue = new Queue(workerQueueName, redisConnectionString)
    addJobProcessors(queue)
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`Could not connect to redis server: ${redisConnectionString}`)
    }
  }
}

main()
