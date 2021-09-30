const forever = require('forever');
const { Monitor } = require('forever-monitor');

class NodeMonitor {
    constructor() {
        this.restartsCount = 0;
    }

    initiate() {
        const child = new (Monitor)('server.js', {
            max: 10,
            silent: false,
            killTree: true,
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

        forever.startServer(child);
    }
}

new NodeMonitor().initiate();
