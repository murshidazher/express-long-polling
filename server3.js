const http = require('http');
const delay = require('delay');
const express = require('express');
const {
    SERVER_PORT,
    MAX_REQUEST_SERVE,
    VERSION,
    REQ_TIMEOUT,
} = require('./config');

const app = express();

const forcedTimeout = 20 * 1000; // default timeout 20 secs

app.get('/', (req, res) => {
    console.log(`SERVER - 🚀 Serving on port ${SERVER_PORT}`);
    res.send('ok');
});

app.get('/hey', async (req, res) => {
    console.log(`SERVER - 🚀 Serving on port ${SERVER_PORT}`);
    await delay(8000);

    console.log(`served - 🚀 Serving on port ${SERVER_PORT}`);

    res.send({
        uuid: `${req.id}`,
        version: `${VERSION}`,
        worker: `${process.pid}`,
        status: 'up',
    });
});

const server = app.listen(SERVER_PORT, () => {
    console.log(`Example app listening at http://localhost:${SERVER_PORT}`);
});

function gracefulShutdown() {
    console.info('Received SIGINT or SIGTERM. Shutting down gracefully...');

    server.close(() => {
        console.info('Closed out remaining connections.');
        process.exit();
    });

    // force stop after timeout
    setTimeout(() => {
        console.error(
            'Could not close connections in time, forcefully shutting down'
        );
        process.exit();
    }, forcedTimeout);
}

// e.g. kill
process.on('SIGTERM', gracefulShutdown);
