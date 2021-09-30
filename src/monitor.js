const { Monitor } = require('forever-monitor');

class NodeMonitor {
    constructor() {
        this.restartsCount = 0;
    }

    initiate() {
        const child = new (Monitor)('server.js', {
            max: 10,
            silent: false,
            uid: "express-long-polling",
            path: "/home/ubuntu/forever/express-long-polling",
            killTree: true,
            append: true,
            pidFile: "/home/ubuntu/forever/express-long-polling/pidfile",
            logFile: "forever.log",
            outFile: "/home/ubuntu/forever/express-long-polling/stdout.log",
            errFile: "/home/ubuntu/forever/express-long-polling/stderr.log",
            sourceDir: "/home/ubuntu/express-long-polling",
            cwd: "/home/ubuntu/express-long-polling",
            args: [this.restartsCount]
        });

        child.on('restart', () => {
            //console.error('Forever restarting script for ' + child.times + ' time');
        });

        child.on('exit:code', (code) => {
            this.restartsCount++;
            //console.error('Forever detected script exited with code ' + code);
            // don't restart the script on SIGTERM
            if (code === 1) {
                child.stop();
            }
            else {
                child.args[1] = this.restartsCount;
            }
        });

        child.start();
    }
}

new NodeMonitor().initiate();
