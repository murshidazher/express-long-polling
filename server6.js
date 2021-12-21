const express = require('express');
const helmet = require('helmet');
const http = require('http');
const GracefulServer = require('@gquittet/graceful-server');
// const { connectToDb, closeDbConnection } = require('./db');

const app = express();
const server = http.createServer(app);
const gracefulServer = GracefulServer(server, {
    closePromises: [],
});

app.use(helmet());

app.get('/test', (_, res) => {
    return res.send({ uptime: process.uptime() || 0 });
});

gracefulServer.on(GracefulServer.READY, () => {
    console.log('Server is ready');
});

gracefulServer.on(GracefulServer.SHUTTING_DOWN, () => {
    console.log('Server is shutting down');
});

gracefulServer.on(GracefulServer.SHUTDOWN, (error) => {
    console.log('Server is down because of', error.message);
});

function fibo(n) {
    if (n < 2) return 1;
    return fibo(n - 2) + fibo(n - 1);
}

app.get('/fib/:num', (req, res) => {
    const { num } = req.params;
    console.log(`SERVER - 🍳 fibo ${num}`);
    console.log(`served - 🤩 ${req.params.num}`);

    res.status(200).send({ fib: fibo(num) });
});

server.listen(8080, async () => {
    // await connectToDb();
    gracefulServer.setReady();
});
