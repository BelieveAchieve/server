const config = require('../config')
const Queue = require('bull')

const queue = new Queue(config.workerQueueName, config.redisConnectionString)

module.exports = {
  add: (job, data, options) => queue.add(job, data, options)
}
