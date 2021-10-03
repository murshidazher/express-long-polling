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

const log = bunyan.createLogger({
    name: 'express-pm2-long-polling',
    version: `${VERSION}`,
    serializers: bunyan.stdSerializers,
});

app.use(
    cors({
        origin: '*',
    })
);

// check readiness
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        log.debug(
            'The application is not ready, but the request will be handled in a development environment'
        );
        next();
    } else if (lightship.isServerReady()) {
        next();
    } else {
        log.error(
            'The application is not in a ready state, the request cannot be handled'
        );
        next(createError.ServiceUnavailable());
    }
});

// add request id
app.use(addRequestId());

// gracefully complete the request
app.use((req, res, next) => {
    if (lightship.isServerShuttingDown()) {
        const msg =
            'Detected that the service is shutting down; ' +
            'No requests will be accepted by this instance anymore';

        log.error(msg);

        // 503 Service Unavailable
        next(createError.ServiceUnavailable(msg));
    }

    // Beacon is live upon creation. Shutdown handlers are suspended
    // until there are no live beacons
    const beacon = lightship.createBeacon({ requestId: req.id });

    log.debug('Incoming request:', { id: req.id });

    onFinished(res, (err) => {
        if (err) {
            log.error(err);
        }
        // After all Beacons are killed, it is possible
        // to proceed with the shutdown routine
        beacon.die();

        log.debug('request has been finished:', { id: req.id });
    });

    // proceeds to the next middleware...
    next();
});

app.get('/', (req, res) => {
    log.info(`SERVER - 🚀 Serving on port ${SERVER_PORT}`);

    res.send({
        uuid: `${req.id}`,
        version: `${VERSION}`,
        worker: `${process.pid}`,
        status: 'up',
    });
});

const server = app.listen(SERVER_PORT);

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

// server is ready to accept connections.
lightship.signalReady();
