const express = require('express')
const WhiteboardCtrl = require('../../controllers/WhiteboardCtrl')

module.exports = function(app) {
  const router = new express.Router()

  /**
   * This is a web socket Express route
   *
   * It relies on a fork of express-ws for rooms support
   * @small-tech/express-ws: https://github.com/aral/express-ws
   */
  router.ws('/room/:sessionId', function(wsClient, req, next) {
    /**
     * On initial client connection, join room.
     * Room is determined by parsing request URL, which includes the unique session ID.
     */
    wsClient.room = this.setRoom(req)

    // The whiteboard controller maps the session ID to a whiteboard document
    const sessionId = req.params.sessionId
    const whiteboardDoc = WhiteboardCtrl.getDoc(sessionId)

    // Send current whiteboard document to the new client
    const newClientResponse = {
      type: 'Data',
      data: whiteboardDoc
    }
    wsClient.send(JSON.stringify(newClientResponse))

    /**
     * Handle new whiteboard data coming in from clients
     * 1. Save the new chunk of whiteboard data to the whiteboard controller
     * 2. Tell this client that you successfully received their message
     * 3. Broadcast the updated whiteboard document to other clients in the room
     */
    wsClient.on('message', rawMessage => {
      const message = JSON.parse(rawMessage)

      if (message.type === 'Data') {
        // 1. Save to whiteboard controller
        const newWhiteboardData = message.data
        WhiteboardCtrl.appendToDoc(sessionId, newWhiteboardData)

        // 2. Acknowledge client
        const clientAcknowledgement = { type: 'Ack' }
        wsClient.send(JSON.stringify(clientAcknowledgement))

        // 3. Broadcast update to room
        const whiteboardDoc = WhiteboardCtrl.getDoc(sessionId)
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
