let fs = require('fs')

module.exports = function(type) {
    this.type = type

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
            //let logs = this.cleanDuplicatedLines(data)
            callback(data)
        })
    }

    this.cleanDuplicatedLines = function(data) {
        const array = data.split('\n')
        let unique = [...new Set(array)]
        return unique.join('<br>')
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