import pino from 'pino'
import config from './config'

function newLogger() {
  let logger

  if (config.NODE_ENV === 'dev') {
    logger = pino({
      prettyPrint: {
        colorize: true
      },
      level: 'debug'
    })
  } else {
    logger = pino({
      level: config.logLevel
    })
  }

  return logger
}

const logger = newLogger()

export default logger
module.exports = logger
