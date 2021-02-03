/**
 * Creates the socket server and returns the Server instance
 */
const http = require('http')
const socket = require('socket.io')
const redisAdapter = require('socket.io-redis')
const config = require('../../config')

// Create an HTTPS server if in production, otherwise use HTTP.
const createServer = app => {
  return http.createServer(app)
}

module.exports = function(app) {
  const server = createServer(app)

  const port =
    process.env.NODE_ENV === 'test'
      ? 4000 + Number(process.env.JEST_WORKER_ID)
      : config.socketsPort

  server.listen(port)

  console.log('Sockets.io listening on port ' + port)

  const io = socket(server)
  if (process.env.NODE_ENV === 'test') return io

  const redisUrl = new URL(config.redisConnectionString)
  io.adapter(redisAdapter({ host: redisUrl.hostname, port: redisUrl.port }))
  return io
}
