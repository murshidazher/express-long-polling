module.exports = {
    HOST: process.env.HOST || '0.0.0.0',
    PORT: 8080,
    SERVER_PORT: '8080',
    VERSION: '1.1.3',
    REQ_TIMEOUT: 60 * 1000, // 60s for timeout
    MAX_REQUEST_SERVE: 1000,
};
