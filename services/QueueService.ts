import config from '../config'
import Queue from 'bull'

const queue = new Queue(config.workerQueueName, config.redisConnectionString)

export default queue
