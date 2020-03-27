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
                    callback(data.toString())
                } else {
                    callback(null)
                }
            })
        }
    }
}