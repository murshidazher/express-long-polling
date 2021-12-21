const http = require('http');
const delay = require('delay');
const express = require('express');
const { createLightship } = require('lightship');

const {
    SERVER_PORT,
    MAX_REQUEST_SERVE,
    VERSION,
    REQ_TIMEOUT,
} = require('./config');

// Lightship will start a HTTP service on port 9000.
const lightship = createLightship();

const app = express();

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

app.listen(SERVER_PORT, () => {
    console.log(`Example app listening at http://localhost:${SERVER_PORT}`);
    lightship.signalReady();
});
