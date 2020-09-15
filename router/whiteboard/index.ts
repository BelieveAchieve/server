import express from 'express';
import ws from 'ws';
import * as Sentry from '@sentry/node';
import WhiteboardService from '../../services/WhiteboardService.js';
import {
  decode,
  encode,
  Message,
  MessageType,
  DecodeError,
  CreationMode
} from '../../utils/zwibblerDecoder';

const captureUnimplemented = (sessionId: string, messageType: string): void => {
  Sentry.captureMessage(
    `Unimplemented Zwibbler message type ${messageType} called in session ${sessionId}`
  );
};

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
    // @todo: figure out correct typing using @types/express-ws
    route: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }) => void;
} = {
  [MessageType.INIT]: ({ message, sessionId, wsClient }) => {
    const document = WhiteboardService.getDoc(sessionId);
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
      WhiteboardService.createDoc(sessionId);
      if (message.data) WhiteboardService.appendToDoc(sessionId, message.data);
      return wsClient.send(
        encode({
          messageType: MessageType.APPEND,
          offset: WhiteboardService.getDocLength(sessionId),
          data: '',
          more: 0
        })
      );
    }
    return wsClient.send(
      encode({
        messageType: MessageType.APPEND,
        offset: 0,
        data: WhiteboardService.getDoc(sessionId),
        more: 0
      })
    );
  },
  [MessageType.APPEND]: ({ message, sessionId, wsClient, route }) => {
    const documentLength = WhiteboardService.getDocLength(sessionId);
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
    WhiteboardService.appendToDoc(sessionId, message.data);

    // Ack unless this is the beginning of a continuation
    if (!message.more) {
      wsClient.send(
        encode({
          messageType: MessageType.ACK_NACK,
          ack: 1,
          offset: WhiteboardService.getDocLength(sessionId),
          more: 0
        })
      );
    }
    route.broadcast(
      wsClient,
      encode({
        messageType: MessageType.APPEND,
        offset: documentLength,
        data: message.data,
        more: message.more
      })
    );
  },
  [MessageType.SET_KEY]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'SET_KEY');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.BROADCAST]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'BROADCAST');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.ERROR]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'ERROR');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.ACK_NACK]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'ACK_NACK');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.KEY_INFORMATION]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'KEY_INFORMATION');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.SET_KEY_ACK_NACK]: ({ wsClient, sessionId }) => {
    captureUnimplemented(sessionId, 'SET_KEY_ACK_NACK');
    wsClient.send(
      encode({
        messageType: MessageType.ERROR,
        description: 'not implemented',
        errorCode: DecodeError.UNIMPLEMENTED_ERROR,
        more: 0
      })
    );
  },
  [MessageType.CONTINUATION]: ({ message, wsClient, sessionId, route }) => {
    WhiteboardService.appendToDoc(sessionId, message.data);
    const broadcastMessage = encode({
      messageType: MessageType.CONTINUATION,
      data: message.data,
      more: message.more
    });
    route.broadcast(wsClient, broadcastMessage);

    // Ack if this is the end of a continuation
    if (!message.more) {
      wsClient.send(
        encode({
          messageType: MessageType.ACK_NACK,
          ack: 1,
          offset: WhiteboardService.getDocLength(sessionId),
          more: 0
        })
      );
    }
  }
};

const whiteboardRouter = function(app): void {
  // @todo: figure out correct typing using @types/express-ws
  const router: any = express.Router(); // eslint-disable-line @typescript-eslint/no-explicit-any

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
        console.log(
          `closing whiteboard socket connection for session ${sessionId}`
        );
        wsClient.close();
      }
    }, 30 * 1000);

    wsClient.on('message', rawMessage => {
      if (rawMessage === "p1ng") {
        // Respond to ping and exit early
        wsClient.send("p0ng");
        return;
      }
      let message = decode(rawMessage as Uint8Array);
      if (!message || !message.messageType) {
        console.log(`unsupported zwibbler client in session ${sessionId}`);
        message = {
          messageType: MessageType.ERROR
        };
      }
      if (message.messageType === MessageType.INIT) initialized = true;
      messageHandlers[message.messageType]
        ? messageHandlers[message.messageType]({
            message,
            sessionId,
            wsClient,
            route: this
          })
        : wsClient.send({ error: 'unsupported message type' });
    });

    next();
  });

  router.ws('/admin/:sessionId', function(wsClient, req, next) {
    const sessionId = req.params.sessionId;

    wsClient.on('message', async rawMessage => {
      const message = decode(rawMessage as Uint8Array);

      if (message.messageType === MessageType.INIT) {
        const document = await WhiteboardService.getFinalDocState(sessionId);
        return wsClient.send(
          encode({
            messageType: MessageType.APPEND,
            offset: 0,
            data: document,
            more: 0
          })
        );
      }
    });
  });

  app.use('/whiteboard', router);
};

module.exports = whiteboardRouter;
export default whiteboardRouter;
