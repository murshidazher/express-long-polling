const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const cors = require('cors');
const { nanoid } = require('nanoid');
const delay = require('delay');
const { createLightship } = require('lightship');
const createError = require('http-errors');
const bunyan = require('bunyan');
const httpShutdown = require('http-shutdown');

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
const lightship = createLightship({
    gracefulShutdownTimeout: 60000,
    shutdownDelay: 60000,
    shutdownHandlerTimeout: 60000,
});

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
        return res.status(503).send(msg);
    }

    // proceeds to the next middleware...
    return next();
});

// app.get('/', (req, res) => {
//     log.info(`SERVER - 🚀 Serving on port ${SERVER_PORT}`);

//     res.send({
//         uuid: `${req.id}`,
//         version: `${VERSION}`,
//         worker: `${process.pid}`,
//         status: 'up',
//     });
// });

function fibo(n) {
    if (n < 2) return 1;
    return fibo(n - 2) + fibo(n - 1);
}

app.get('/fib/:num', async (req, res) => {
    // Beacon is live upon creation. Shutdown handlers are suspended
    // until there are no live beacons
    const beacon = lightship.createBeacon({ requestId: req.id });
    const { num } = req.params;

    console.log(`SERVER - 🍳 fibo ${num}`);
    const fib = fibo(num);
    console.log(`served - 🤩 ${req.params.num} - ${fib}`);

    res.status(200).send({ fib });

    // After all Beacons are killed, it is possible
    // to proceed with the shutdown routine
    beacon.die();

    log.debug('request has been finished:', { id: req.id });
});

app.get('/fib/:num', (req, res) => {
    const { num } = req.params;

    const fib = fibo(num);
    console.log(`SERVER - 🍳 fibo ${num}`);
    console.log(`served - 🤩 ${req.params.num} - ${fib}`);

    res.status(200).send({ fib });
});

const server = httpShutdown(http.createServer(app));

server
    .listen(SERVER_PORT, () => {
        lightship.signalReady();
        log.info(`Example app listening at http://localhost:${3000}`);
    })
    .on('close', () => {
        console.info('Received close event');
        lightship.signalNotReady('server');
    })
    .on('error', () => {
        console.log(`shutting down server`);
        lightship.signalNotReady('server');
        lightship.shutdown();
    });

lightship.registerShutdownHandler(
    () =>
        new Promise((resolve, reject) => {
            // allow sufficient amount of time to allow all of the existing
            // HTTP requests to finish before terminating the service.
            console.log('⛔️ registerShutdownHandler - server is shut down.');
            console.warn('Closing the server...');
            server.close((error) => {
                if (error) {
                    console.error(error.stack || error);
                    reject(error.message);
                } else {
                    console.info('... successfully closed the server!');
                    resolve();
                }
            });

            // detect what is keeping node process alive
            whyIsNodeRunning();
        }, 8000)
);

// lightship.registerShutdownHandler(async () => {
//     // allow sufficient amount of time to allow all of the existing
//     // HTTP requests to finish before terminating the service.
//     console.log('⛔️ registerShutdownHandler - server is shut down.');

//     // force stop after timeout
//     setTimeout(() => {
//         server.close(() => {
//             console.log('⛔️ SERVER_IS_SHUTTING_DOWN - server is shut down.');
//             process.exit();
//         });

//         // detect what is keeping node process alive
//         whyIsNodeRunning();
//     }, REQ_TIMEOUT);
// });

// server is ready to accept connections.
lightship.signalReady();

console.log(`server port: ${server.address().port}`);
console.log(`lightship port: ${lightship.server.address().port}`);
