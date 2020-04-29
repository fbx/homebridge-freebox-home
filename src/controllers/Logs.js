let fs = require('fs')

module.exports = function() {

    this.getHomebridgeLogs = function(callback) {
        let path = '/etc/.pm2/logs/homebridge-out.log'
        this.getLogs(path, (data) => {
            callback(data)
        })
    }

    this.getHomebridgeErrorLogs = function(callback) {
        let path = '/etc/.pm2/logs/homebridge-error.log'
        this.getLogs(path, (data) => {
            callback(data)
        })
    }
    
    this.getServerErrorLogs = function(callback) {
        let path = '/etc/.pm2/logs/index-error.log'
        this.getLogs(path, (data) => {
            callback(data)
        })
    }

    this.getServerLogs = function(callback) {
        let path = '/etc/.pm2/logs/index-out.log'
        this.getLogs(path, (data) => {
            callback(data)
        })
    }

    this.getLogs = function(path, callback) {
        this.getContentOfFile(path, (data) => {
            callback(data)
        })
    }

    this.getContentOfFile = function(path, callback) {
        if(fs.existsSync(path)) {
            fs.readFile(path, (error, data) => {
                if (!error) {
                    var log = ''
                    let lines = data.toString().split('\n')
                    for (line of lines) {
                        log = log + line + '</br>'
                    }
                    callback(log)
                } else {
                    callback(null)
                }
            })
        }
    }

    this.clearLogs = function(callback) {
        const { exec } = require("child_process");
        var command = 'echo \'\' > /etc/.pm2/logs/index-out.log'
        command = command +' && echo \'\' > /etc/.pm2/logs/index-error.log'
        command = command +' && echo \'\' > /etc/.pm2/logs/homebridge-out.log'
        command = command +' && echo \'\' > /etc/.pm2/logs/homebridge-error.log'
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
}