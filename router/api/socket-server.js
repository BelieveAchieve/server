/**
 * Creates the socket server and returns the Server instance
 */

const fs = require('fs')
const http = require('http')
const https = require('https')
const socket = require('socket.io')

const config = require('../../config')

// Create an HTTPS server if in production, otherwise use HTTP.
const createServer = app => {
  if (config.NODE_ENV === 'production') {
    return https.createServer(
      {
        key: fs.readFileSync(`${config.SSL_CERT_PATH}/privkey.pem`),
        cert: fs.readFileSync(`${config.SSL_CERT_PATH}/fullchain.pem`),
        ca: fs.readFileSync(`${config.SSL_CERT_PATH}/chain.pem`)
      },
      app
    )
  } else {
    return http.createServer(app)
  }
}

module.exports = function(app) {
  const server = createServer(app)

  const port = config.socketsPort
  server.listen(port)

  console.log('Sockets.io listening on port ' + port)

  return socket(server)
}
