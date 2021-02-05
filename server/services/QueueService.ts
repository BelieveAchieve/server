import Queue from 'bull'
import config from '../config'

const queue = new Queue(config.workerQueueName, config.redisConnectionString)

module.exports = queue
export default queue
