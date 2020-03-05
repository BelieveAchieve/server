const express = require('express')
const WhiteboardCtrl = require('../../controllers/WhiteboardCtrl')

module.exports = function(app) {
  const router = new express.Router()

  /**
   * A web socket Express route
   *
   * Relies on a fork of express-ws for rooms support
   * @small-tech/express-ws: https://github.com/aral/express-ws
   */
  router.ws('/room/:sessionId', function(wsClient, req, next) {
    /**
     * On initial client connection, join room.
     * Room is determined by parsing request URL.
     */
    wsClient.room = this.setRoom(req)

    const whiteboardDoc = WhiteboardCtrl.getDoc(wsClient.room)
    const newClientResponse = {
      type: 'Data',
      data: whiteboardDoc
    }

    wsClient.send(JSON.stringify(newClientResponse))

    wsClient.on('message', rawMessage => {
      const message = JSON.parse(rawMessage)

      if (message.type === 'Data') {
        const newWhiteboardData = message.data
        WhiteboardCtrl.addToDoc(wsClient.room, newWhiteboardData)

        const clientAcknowledgement = { type: 'Ack' }
        wsClient.send(JSON.stringify(clientAcknowledgement))

        const whiteboardDoc = WhiteboardCtrl.getDoc(wsClient.room)
        const whiteboardUpdate = {
          type: 'Data',
          data: whiteboardDoc
        }
        this.broadcast(wsClient, JSON.stringify(whiteboardUpdate))
      }
    })

    next()
  })

  app.use('/whiteboard', router)
}
