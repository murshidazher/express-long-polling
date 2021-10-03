const express = require('express');
const cors = require('cors');
const { VERSION } = require('./config');

const app = express();

app.use(
    cors({
        origin: '*',
    })
);

app.use((req, res, next) => {
    console.log(`URL: ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send({
        uuid: `${req.id}`,
        version: `${VERSION}`,
        worker: `${process.pid}`,
        status: 'up',
    });
});

app.listen(8080, () => {
    console.log('Listening on port 8080');
});
