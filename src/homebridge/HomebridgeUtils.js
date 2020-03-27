module.exports.clean = function(callback) {
    const { exec } = require("child_process");
    let command = 'rm /root/.homebridge/persist/*'
    exec(command, (error, stdout, stderr) => {
        if (error) {
            //console.log(`error: ${error.message}`)
            callback(false)
        }
        if (stderr) {
            //console.log(`stderr: ${stderr}`)
            callback(false)
        }
        //console.log(`stdout: ${stdout}`)
        callback(true)
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
                    if (error) {
                        //console.log(`error: ${error.message}`)
                        callback(false)
                    }
                    if (stderr) {
                        //console.log(`stderr: ${stderr}`)
                        callback(false)
                    }
                    //console.log(`stdout: ${stdout}`)
                    callback(true)
                })
            }
        })
    } else {
        callback(false)
    }
}