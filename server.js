const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const delay = require('delay');
const { createLightship } = require('lightship');
const createError = require('http-errors');
const bunyan = require('bunyan');
const whyIsNodeRunning = require('why-is-node-running');
const addRequestId = require('express-request-id');
const onFinished = require('on-finished');

const {
  SERVER_PORT,
  MAX_REQUEST_SERVE,
  VERSION,
  REQ_TIMEOUT,
} = require('./config');

const app = express();
const lightship = createLightship();

let total = 0;
let runningTotal = 0;

const log = bunyan.createLogger({
  name: 'express-pm2-long-polling',
  version: `${VERSION}`,
  serializers: bunyan.stdSerializers,
});

app.use(
  cors({
    origin: '*',
  }),
);

app.get('/', (req, res) => {
  total += 1;
  runningTotal += 1;

  // serve MAX_REQUEST_SERVE requests and shutdown
  // if (total === MAX_REQUEST_SERVE) {
  //   lightship.shutdown();
  // }

  setTimeout(() => {
    runningTotal -= 1;

    if (runningTotal < 100) {
      lightship.signalReady();
      log.warn('SERVER_IS_READY - server is ready to requests.');
    } else {
      lightship.signalNotReady();
      log.warn("SERVER_IS_NOT_READY - server isn't ready yet.");
    }
  }, REQ_TIMEOUT);

  log.info(`SERVER - 🚀 Serving on port ${SERVER_PORT}`);

  res.send({
    uuid: `${req.id}`,
    version: `${VERSION}`,
    worker: `${process.pid}`,
    status: 'up',
  });
});

lightship.queueBlockingTask(
  new Promise((resolve) => {
    setTimeout(() => {
      // Lightship service status will be `SERVER_IS_NOT_READY` until all promises
      // submitted to `queueBlockingTask` are resolved.
      resolve();
    }, 1000);
  }),
);

const server = app.listen(SERVER_PORT, () => {
  // All signals will be queued until after all blocking tasks are resolved.
  // server is ready to accept connections.
  lightship.signalReady();
});

lightship.registerShutdownHandler(async () => {
  // allow sufficient amount of time to allow all of the existing
  // HTTP requests to finish before terminating the service.
  await delay(REQ_TIMEOUT);

  server.close(() => {
    log.warn('SERVER_IS_SHUTTING_DOWN - server is shut down.');
  });

  // detect what is keeping node process alive
  whyIsNodeRunning();
});
