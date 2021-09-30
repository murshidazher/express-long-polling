const { Monitor } = require('forever-monitor')

class NodeMonitor {
    constructor() {
        this.restartsCount = 0
        this.child = null
    }

    initiate() {
        this.child = new Monitor('server.js', {
            max: 10,
            silent: false,
            uid: 'express-long-polling',
            path: '/home/ubuntu/forever/express-long-polling',
            killTree: true,
            append: true,
            pidFile: `/home/ubuntu/forever/express-long-polling/pidfile`,
            logFile: 'forever.log',
            outFile: '/home/ubuntu/forever/express-long-polling/stdout.log',
            errFile: '/home/ubuntu/forever/express-long-polling/stderr.log',
            sourceDir: '/home/ubuntu/express-long-polling',
            cwd: '/home/ubuntu/express-long-polling',
            args: [this.restartsCount],
        })

        this.child.on('restart', () => {
            // console.error('Forever restarting script for ' + child.times + ' time');
        })

        this.child.on('exit:code', (code) => {
            this.exit(code)
        })

        this.child.start()
    }

    exit(code) {
        this.restartsCount += 1
        // console.error('Forever detected script exited with code ' + code);
        // don't restart the script on SIGTERM
        if (code === 1) {
            this.child.stop()
        } else {
            this.child.args[1] = this.restartsCount
        }
    }
}

new NodeMonitor().initiate()
