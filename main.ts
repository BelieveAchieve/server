import 'newrelic';
import path from 'path';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import busboy from 'connect-busboy';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request } from 'express';
import expressWs from '@small-tech/express-ws';
import logger from 'morgan';
import mongoose from 'mongoose';
import { Static } from 'runtypes';
import rawConfig from './config';
import { Config } from './config-type';
import router from './router';
import promisifyLogin from './middleware/promisify-login';

const main = (): void => {
  let config: Static<typeof Config>;

  try {
    config = Config.check(rawConfig);
  } catch (error) {
    console.trace(`${error.name}: ${error.message} [${error.key}]`);
    return;
  }
  interface LoadedRequest extends Request {
    user: {};
  }

  // Set up Sentry error tracking
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.NODE_ENV
  });

  // Database
  mongoose.connect(config.database, { useNewUrlParser: true });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('Connected to database');
  });

  // Express App
  const app = express();

  /**
   * Account for nginx proxy when getting client's IP address
   * http://expressjs.com/en/guide/behind-proxies.html
   */
  app.set('trust proxy', true);

  // Setup middleware
  app.use(Sentry.Handlers.requestHandler()); // The Sentry request handler must be the first middleware on the app
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser(config.sessionSecret));
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use(busboy());
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: config.NODE_ENV === 'dev' ? ['Date'] : undefined
    })
  );
  // see https://stackoverflow.com/questions/51023943/nodejs-getting-username-of-logged-in-user-within-route
  app.use((req: LoadedRequest, res, next) => {
    res.locals.user = req.user || null;
    next();
  });

  // Middleware to make req.login async
  app.use(promisifyLogin);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Send error responses to API requests after they are passed to Sentry
  app.use(
    ['/api', '/auth', '/contact', '/school', '/twiml', '/whiteboard'],
    (err, req, res, next) => {
      res.status(err.httpStatus || 500).json({ err: err.message || err });
      next();
    }
  );

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log('Listening on port ' + port);
  });

  // initialize Express WebSockets
  expressWs(app, server);

  // Load server router
  router(app);
};

main();
