const http = require('http');
const express = require('express');
const delay = require('delay');

const terminus = require('@godaddy/terminus').createTerminus;

const app = express();

const { SERVER_PORT, HOST, PORT } = require('./config');

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

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind =
        typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.info(`Listening on ${bind}`);
}

terminus(server, {
    signal: 'SIGTERM',
    healthChecks: {
        '/healthcheck': () => {
            return { status: 'ok' };
        },
        verbatim: true,
    },
    timeout: 60000,
    onSignal: async () => {
        console.log('Server is starting cleanup');
        await app.get('services').clean();
    },
})
    .listen(PORT, HOST)
    .on('error', onError)
    .on('listening', onListening)
    .on('close', () => {
        console.log('closing the server');
    });

// Process error handlers
process
    .on('unhandledRejection', (promise, reason) => {
        console.error('Unhandled Rejection: %s', reason);
        process.exit(1);
    })
    .on('uncaughtException', (err) => {
        console.error('Uncaught Exception: %s', err);
        process.exit(1);
    });
