const http = require('http');
const express = require('express');
const { createLightship } = require('lightship');
const httpShutdown = require('http-shutdown');

// Lightship will start a HTTP service on port 9000.
const lightship = createLightship({
    detectKubernetes: false,
});

const app = express();

const server = httpShutdown(http.createServer(app));

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

server
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
        }, 8000)
);
