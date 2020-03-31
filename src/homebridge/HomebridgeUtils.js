let fs = require('fs')

module.exports.clean = function(callback) {
    const { exec } = require("child_process");
    let command = 'rm /root/.homebridge/persist/*'
    exec(command, (error, stdout, stderr) => {
        var success = true
        if (error) {
            success = false
            console.log(error)
        }
        if (stderr) {
            success = false
            console.log(`${stderr}`)
        }
        callback(success)
    })
}

module.exports.restart = function(callback) {
    let pm2Dir = '/etc/.pm2/pm2.pid'
    if(fs.existsSync(pm2Dir)) {
        fs.readFile('/etc/.pm2/pids/homebridge-0.pid', (err, data) => {
            if (err == null) {
                const { exec } = require("child_process");
                let command = 'sudo kill -KILL ' + data
                exec(command, (error, stdout, stderr) => {
                    var success = true
                    if (error) {
                        success = false
                        console.log(error)
                    }
                    if (stderr) {
                        success = false
                        console.log(`${stderr}`)
                    }
                    callback(success)
                })
            }
        })
    } else {
        callback(false)
    }
}