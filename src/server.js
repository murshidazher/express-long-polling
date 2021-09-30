const http = require('http')
const ON_DEATH = require('death')({ SIGHUP: true, uncaughtException: true })
const settings = require('./settings/settings')

class Server {
    constructor() {
        this.httpServer = null
        this.isProcessExit = false
        this.setProcess()
        this.initiate()
        this.run()
    }

    initiate() {
        const { NODE_ENV, SERVER_PORT } = settings

        this.httpServer = http.createServer(this.app)
        this.httpServer.listen(SERVER_PORT)
        this.httpServer.on('error', (error) => {
            if (error.syscall === 'listen') {
                let errorMessage = null
                switch (error.code) {
                    case 'EACCES': {
                        errorMessage = `port ${SERVER_PORT} requires elevated privileges`
                        break
                    }
                    case 'EADDRINUSE': {
                        errorMessage = `port ${SERVER_PORT} is already in use`
                        break
                    }
                    default: {
                        errorMessage = `port ${SERVER_PORT} has an uncaught error ${error.code}`
                        break
                    }
                }
                if (errorMessage) {
                    console.log(errorMessage)
                }
            }
            throw error
        })

        this.httpServer.on('listening', (req, res) => {
            this.log(
                `The server is now listening to port ${SERVER_PORT}. The server is now running on ${NODE_ENV} environment.`
            )
        })
    }

    setProcess() {
        ON_DEATH((signal, err) => {
            const crashed = typeof err !== 'string'

            if (crashed) {
                if (err.statusCode >= 500 || err.statusCode === 429) {
                    console.log(err.body)
                }

                process.kill(process.pid, 'SIGKILL')
            }

            if (!crashed) {
                console.log(`Received kill signal \`${signal}\`, stopping...`)
            }

            if (signal === 'SIGTERM') {
                this.isProcessExit = true
            }
        })
    }

    run() {
        setTimeout(() => {
            if (this.isProcessExit) {
                console.log(`Close all connections ${process.pid}`)
                console.log(process.argv[2])
                process.exit(2)
            }

            // console.log(process.stdout);

            // console.log(`isRestarted: ${process}`);
            process.exit(2)
            // process.kill(process.pid, 'SIGKILL'); // this will cause forever to restart the script.

            /*             setTimeout(() => {
                            process.kill(process.pid, 'SIGTERM');  // this will cause forever to stop the script.
                        }, 1000); */
        }, 3000)
    }

    log(text) {
        console.log(`===${text}===`)
    }

    app(req, res) {
        const { VERSION } = settings
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)

        res.end(
            JSON.stringify({
                message: `v${VERSION}`,
                worker: `${process.pid}`,
                status: 'up',
            })
        )
    }
}

new Server()
