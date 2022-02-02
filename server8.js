const express = require('express');
const { createLightship } = require('lightship');
const cors = require('cors');

// Lightship will start a HTTP service on port 9000.
// add graceful shutdown monitor
const lightship = createLightship({
    detectKubernetes: false,
    shutdownHandlerTimeout: 20000,
    shutdownDelay: 20000,
    gracefulShutdownTimeout: 60000,
    terminate: () => {
        // detect what is keeping the node process still alive.
        const whyIsNodeRunning = require('why-is-node-running');
        whyIsNodeRunning();

        // eslint-disable-next-line no-console
        console.log(
            `api server is shutting down - ${new Date().toUTCString()}`
        );
        process.exit(0);
    },
});

const app = express();

app.use(
    cors({
        origin: '*',
    })
);

// ------------------ Add Middlewares ---------------

// check readiness
app.use((req, res, next) => {
    console.log(lightship.isServerShuttingDown(), lightship.isServerReady());
    if (lightship.isServerShuttingDown()) {
        console.error('The server is shutting down');
        return res.status(503).send('service unavailable');
    }

    if (lightship.isServerReady()) {
        console.log('request server ready');
    }
    if (process.env.NODE_ENV === 'development') {
        console.log(
            'The application is not ready, but the request will be handled in a development environment'
        );
    }

    const beacon = lightship.createBeacon();

    next();
    beacon.die();
});

// // add request id
// app.use(addRequestId());

// // gracefully complete the request
// app.use((req, res, next) => {
//     // Beacon is live upon creation. Shutdown handlers are suspended
//     // until there are no live beacons
//     const beacon = lightship.createBeacon({ requestId: req.id });

//     try {
//         next();
//     } catch (e) {
//         console.log('eeer', e);
//     }
//     // After all Beacons are killed, it is possible
//     // to proceed with the shutdown routine
//     beacon.die();

//     console.log('request has been finished:', { id: req.id });
// });

// ------------------ End Middlewares ---------------
app.get('/', (req, res) => {
    res.send('ok');
});

function fibo(n) {
    if (n < 2) return 1;
    return fibo(n - 2) + fibo(n - 1);
}

app.get('/fib/:num', (req, res) => {
    const { num } = req.params;

    const fib = fibo(num);
    console.log(`SERVER - 🍳 fibo ${num}`);
    console.log(`served - 🤩 ${req.params.num} - ${fib}`);

    res.status(200).send({ fib });
});

// Launch the app:
const PORT = process.env.PORT || 8080;

const server = app
    .listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);

        // Tell Kubernetes that we are now ready to process incoming HTTP requests:
        lightship.signalReady();
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
            console.log('Closing the server...');
            lightship.shutdown();
            server.close((error) => {
                if (error) {
                    console.log(error.stack || error);
                    reject(error.message);
                } else {
                    console.log('... successfully closed the server!');
                    resolve();
                }
            });
        })
);

// PORTS
console.log(`server port: ${server.address().port}`);
console.log(`lightship port: ${lightship.server.address().port}`);
