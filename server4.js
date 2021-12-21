const http = require('http');
const express = require('express');
const delay = require('delay');

const { createTerminus, HealthCheckError } = require('@godaddy/terminus');

const app = express();

const { SERVER_PORT, VERSION, REQ_TIMEOUT } = require('./config');

app.get('/', (req, res) => {
    res.send('ok');
});

function fibo(n) {
    if (n < 2) return 1;
    return fibo(n - 2) + fibo(n - 1);
}

app.get('/fib/:num', (req, res) => {
    const { num } = req.params;
    console.log(`SERVER - 🍳 fibo ${num}`);
    res.send({ fib: fibo(num) });
    console.log(`served - 🤩 ${req.params.num}`);
});

const server = http.createServer(app);

function onSignal() {
    console.log('server is starting cleanup');
    // start cleanup of resource, like databases or file descriptors
}

async function onHealthCheck() {
    // checks if the system is healthy, like the db connection is live
    // resolves, if health, rejects if not
}

createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
        '/healthcheck': onHealthCheck,
    },
    onSignal,
    timeout: 4000,
    signals: ['SIGTERM', 'SIGINT', 'SIGHUP'],
});

server.listen(SERVER_PORT);
