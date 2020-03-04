const express = require('express')

const zwibRooms = {}

module.exports = function(app) {
  const router = new express.Router()

  router.ws('/room/:roomId', function(wsClient, req, next) {
    wsClient.room = this.setRoom(req)
    console.log(`New client connected to ${wsClient.room}`)

    if (!zwibRooms[wsClient.room]) {
      zwibRooms[wsClient.room] = {
        zwibDoc: ''
      }
    } else {
      const newClientResponse = {
        type: 'Data',
        data: zwibRooms[wsClient.room].zwibDoc
      }

      wsClient.send(JSON.stringify(newClientResponse))
    }

    wsClient.on('message', rawMessage => {
      const message = JSON.parse(rawMessage)

      if (message.type === 'Data') {
        zwibRooms[wsClient.room].zwibDoc += message.data

        const clientResponse = { type: 'Ack' }
        wsClient.send(JSON.stringify(clientResponse))

        const roomResponse = {
          type: 'Data',
          data: zwibRooms[wsClient.room].zwibDoc
        }

        const numberOfRecipients = this.broadcast(
          wsClient,
          JSON.stringify(roomResponse)
        )

        console.log(
          `${
            wsClient.room
          } message broadcast to ${numberOfRecipients} recipient${
            numberOfRecipients === 1 ? '' : 's'
          }.`
        )
      } else {
        console.log('Non-data message: ', message)
      }
    })

    next()
  })

  app.use('/whiteboard', router)
}
