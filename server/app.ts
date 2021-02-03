import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request } from 'express';
import expressWs from '@small-tech/express-ws';
import config from './config';
import router from './router';
import cacheControl from 'express-cache-controller';
import timeout from 'connect-timeout';
import logger from './logger';
import expressPino from 'express-pino-logger';
import Mustache from 'mustache';

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

let distDir
if (process.env.NODE_ENV === 'production') {
  distDir = '../../dist'
} else {
  distDir = '../dist'
}

interface LoadedRequest extends Request {
  user: {};
  login: Function;
}

// Set up Sentry error tracking
Sentry.init({
  dsn: config.sentryDsn,
  environment: config.NODE_ENV
});

// Express App
const app = express();

const indexHtml = renderIndexHtml()

const expressLogger = expressPino({ logger })
app.use(expressLogger)

app.use(timeout(300000));

/**
 * Account for nginx proxy when getting client's IP address
 * http://expressjs.com/en/guide/behind-proxies.html
 */
app.set('trust proxy', true);

// Setup middleware
app.use(Sentry.Handlers.requestHandler()); // The Sentry request handler must be the first middleware on the app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.sessionSecret));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: config.NODE_ENV === 'dev' ? ['Date'] : undefined
  })
);
// for now, send directive to never cache to prevent Zwibbler issues
// until we figure out a caching strategy
app.use(cacheControl({
  noCache: true
}));
app.use(haltOnTimedout);
// see https://stackoverflow.com/questions/51023943/nodejs-getting-username-of-logged-in-user-within-route
app.use((req: LoadedRequest, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Make req.login async
app.use((req: LoadedRequest, res, next): void => {
  req.login = promisify(req.login);
  next();
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// initialize Express WebSockets
expressWs(app);

// Load server router
router(app);
app.use(haltOnTimedout);

// Send error responses to API requests after they are passed to Sentry
app.use(
  ['/api', '/auth', '/contact', '/school', '/twiml', '/whiteboard'], haltOnTimedout,
  (err, req, res, next) => {
    res.status(err.httpStatus || 500).json({ err: err.message || err });
    next();
  }
);
app.use(haltOnTimedout)

app.use(/.*css|.*js|.*mp3|.*png|.*svg|.*jpg|.*JPG|.*pdf|.*ttf|.*woff|.*woff2|.*eot/, express.static(path.join(__dirname, distDir)));

app.use((req, res, next) => {
  res.send(indexHtml).status(200);
  next();
})

export default app

function renderIndexHtml() {
  let template = ""
  const indexPath = path.join(__dirname, `${distDir}/index.html`)
  try {
    template = fs.readFileSync(indexPath, "utf8")
  } catch (err) {
    logger.error(`error reading index.html file: ${err}`)
    process.exit(1)
  }
  // speeds up rendering on the first request
  Mustache.parse(template)

  const config = {
    zwibblerUrl: process.env.VUE_APP_ZWIBBLER_URL,
    websocketRoot: process.env.VUE_APP_WEBSOCKET_ROOT,
    serverRoot: process.env.VUE_APP_SERVER_ROOT,
    socketAddress: process.env.VUE_APP_SOCKET_ADDRESS,
    mainWebsiteUrl: process.env.VUE_APP_MAIN_WEBSITE_URL,
    posthogToken: process.env.VUE_APP_POSTHOG_TOKEN,
    papercupsId: process.env.VUE_APP_PAPERCUPS_ID,
    unleashUrl: process.env.VUE_APP_UNLEASH_URL,
    unleashName: process.env.VUE_APP_UNLEASH_NAME,
    unleashId: process.env.VUE_APP_UNLEASH_ID,
    newRelicBrowserAccountId: process.env.VUE_APP_NEW_RELIC_ACCOUNT_ID,
    newRelicBrowserTrustKey: process.env.VUE_APP_NEW_RELIC_TRUST_KEY,
    newRelicBrowserAgentId: process.env.VUE_APP_NEW_RELIC_AGENT_ID,
    newRelicBrowserLicenseKey: process.env.VUE_APP_NEW_RELIC_LICENSE_KEY,
    newRelicBrowserAppId: process.env.VUE_APP_NEW_RELIC_APP_ID
  }

  return Mustache.render(template, config)
}
