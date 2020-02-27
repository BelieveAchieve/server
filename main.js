// Dependencies
const http = require('http')
const express = require('express')
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const busboy = require('connect-busboy')
const cors = require('cors')
const mongoose = require('mongoose')
const Sentry = require('@sentry/node')
const startCronJobs = require('./cron-jobs')

// Configuration
const config = require('./config')

// Set up Sentry error tracking
Sentry.init({
  dsn: config.sentryDsn,
  environment: config.NODE_ENV
})

// Database
mongoose.connect(config.database, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('Connected to database')
})

// Initiate cron jobs
startCronJobs()

const app = express()
app.set('port', process.env.PORT || 3000)

// Setup middleware
app.use(Sentry.Handlers.requestHandler()) // The Sentry request handler must be the first middleware on the app
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser(config.sessionSecret))
app.use(express.static(path.join(__dirname, 'dist')))
app.use(busboy())
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: config.NODE_ENV === 'dev' ? ['Date'] : undefined
  })
)
// see https://stackoverflow.com/questions/51023943/nodejs-getting-username-of-logged-in-user-within-route
app.use(function(req, res, next) {
  res.locals.user = req.user || null
  next()
})

const server = http.createServer(app)

const port = app.get('port')
server.listen(port)
console.log('Listening on port ' + port)

// Load server router
require('./router')(app)

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler())

// Send error responses to API requests after they are passed to Sentry
app.use(['/api', '/auth', '/contact', '/school', '/twiml'], function(
  err,
  req,
  res,
  next
) {
  res.status(err.httpStatus || 500).json({ err: err.message || err })
})
