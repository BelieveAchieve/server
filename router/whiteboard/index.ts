import express from 'express';
import ws from 'ws';
import WhiteboardCtrl from '../../controllers/WhiteboardCtrl.js';
import {
  decode,
  encode,
  Message,
  MessageType,
  DecodeError,
  CreationMode
} from '../../utils/zwibblerDecoder';

const messageHandlers: {
  [type in MessageType]: ({
    message,
    sessionId,
    wsClient,
    route
  }: {
    message: Message;
    sessionId: string;
    wsClient: ws;
    // TODO: figure out correct typing
    route: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }) => void;
} = {
  [MessageType.INIT]: ({ message, sessionId, wsClient }) => {
    const document = WhiteboardCtrl.getDoc(sessionId);
    if (
      message.creationMode === CreationMode.NEVER_CREATE &&
      document === undefined
    ) {
      return wsClient.send(
        encode({
          messageType: MessageType.ERROR,
          errorCode: DecodeError.DOES_NOT_EXIST,
          more: 0,
          description: 'does not exist'
        })
      );
    }
    if (
      message.creationMode === CreationMode.ALWAYS_CREATE &&
      document !== undefined
    ) {
      return wsClient.send(
        encode({
          messageType: MessageType.ERROR,
          errorCode: DecodeError.ALREADY_EXISTS,
          more: 0,
          description: 'already exists'
        })
      );
    }
    if (
      (message.creationMode === CreationMode.ALWAYS_CREATE ||
        message.creationMode === CreationMode.POSSIBLY_CREATE) &&
      document === undefined
    ) {
      WhiteboardCtrl.createDoc(sessionId);
      if (message.data) WhiteboardCtrl.appendToDoc(sessionId, message.data);
      return wsClient.send(
        encode({
          messageType: MessageType.APPEND,
          offset: WhiteboardCtrl.getDocLength(sessionId),
          data: '',
          more: 0
        })
      );
    }
    return wsClient.send(
      encode({
        messageType: MessageType.APPEND,
        offset: 0,
        data: WhiteboardCtrl.getDoc(sessionId),
        more: 0
      })
    );
  },
  [MessageType.APPEND]: ({ message, sessionId, wsClient, route }) => {
    const documentLength = WhiteboardCtrl.getDocLength(sessionId);
    console.log(documentLength);
    if (message.offset !== documentLength) {
      return wsClient.send(
        encode({
          messageType: MessageType.ACK_NACK,
          ack: 0,
          offset: documentLength,
          more: 0
        })
      );
    }
    console.log('appending to ' + sessionId);
    console.log(message.data);
    WhiteboardCtrl.appendToDoc(sessionId, message.data);
    wsClient.send(
      encode({
        messageType: MessageType.ACK_NACK,
        ack: 1,
        offset: WhiteboardCtrl.getDocLength(sessionId),
        more: 0
      })
    );
    route.broadcast(
      wsClient,
      encode({
        messageType: MessageType.APPEND,
        offset: documentLength,
        data: message.data,
        more: 0
      })
    );
  },
  [MessageType.SET_KEY]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.BROADCAST]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.ERROR]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.ACK_NACK]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.KEY_INFORMATION]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.SET_KEY_ACK_NACK]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    ),
  [MessageType.CONTINUATION]: ({ wsClient }) =>
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    )
};

const router = function(app) {
  const router = express.Router();

  /**
   * This is a web socket Express route
   *
   * It relies on a fork of express-ws for rooms support
   * @small-tech/express-ws: https://github.com/aral/express-ws
   */
  router.ws('/room/:sessionId', function(wsClient, req, next) {
    let initialized = false;

    /**
     * On initial client connection, join room.
     * Room is determined by parsing request URL, which includes the unique session ID.
     */
    wsClient.room = this.setRoom(req);

    const sessionId = req.params.sessionId;

    setTimeout(() => {
      if (!initialized) {
        console.log('close connection');
        wsClient.close();
      }
    }, 30 * 1000);

    /**
     * Handle new whiteboard data coming in from clients
     * 1. Save the new chunk of whiteboard data to the whiteboard controller
     * 2. Tell this client that you successfully received their message
     * 3. Broadcast the updated whiteboard document to other clients in the room
     */
    wsClient.on('message', rawMessage => {
      console.log('message: ');
      console.log(decode(rawMessage as Uint8Array));
      const message = decode(rawMessage as Uint8Array);
      if (message.messageType === MessageType.INIT) initialized = true;
      messageHandlers[message.messageType]
        ? messageHandlers[message.messageType]({
            message,
            sessionId,
            wsClient,
            route: this
          })
        : wsClient.send({ error: 'unsupported message type' });

      // if (message.type === 'Data') {
      //   // 1. Save to whiteboard controller
      //   const newWhiteboardData = message.data;
      //   WhiteboardCtrl.appendToDoc(sessionId, newWhiteboardData);

      //   // 2. Acknowledge client
      //   const clientAcknowledgement = { type: 'Ack' };
      //   wsClient.send(JSON.stringify(clientAcknowledgement));

      //   // 3. Broadcast update to room
      //   const whiteboardDoc = WhiteboardCtrl.getDoc(sessionId);
      //   const whiteboardUpdate = {
      //     type: 'Data',
      //     data: whiteboardDoc
      //   };
      //   this.broadcast(wsClient, JSON.stringify(whiteboardUpdate));
      // }
    });

    next();
  });

  app.use('/whiteboard', router);
};

module.exports = router;
export default router;
