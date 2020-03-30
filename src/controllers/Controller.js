let Alarm = require('./Alarm')
let Sensor = require('./Sensor')
let Logs = require('./Logs')
let FreeboxRequest = require('../freeboxOS/FreeboxRequest')
let HomebridgeConf = require('../homebridge/HomebridgeConf')
let homebridgeUtils = require('../homebridge/HomebridgeUtils')
let credentials = require('../freeboxOS/Credentials')

module.exports = function() {
    this.alarm = new Alarm()
    this.sensor = new Sensor()
    this.freeboxRequest = new FreeboxRequest()
    
    this.init = function() {
        this.alarm.init()
        this.sensor.init(this.freeboxRequest)
    }

    this.startFreeboxAuthentication = function(callback) {
        credentials.getStoredCredentials((data) => {
            this.freeboxRequest.freeboxAuth(data.token, data.track, (token, sessionToken, trackId, challenge) => {
                credentials.update(token, trackId, (success) => {})
                callback(sessionToken != null)
            })
        })
    }

    this.testRequest = function(callback) {
        this.freeboxRequest.request('GET', 'http://mafreebox.freebox.fr/api/v6/downloads/', null, (code, data) => {
            callback(code)
        }, false)
    }

    // ------------
    // Ping
    // ------------

    // > [GET] host:port/api/ping
    // Will just if tell the server is up.
    this.handlePing = function(response) {
        response.status(200)
        response.send('OK')
    }

    // ------------
    // Freebox
    // ------------

    // > [GET] host:port/api/fbx/rights
    // Will return a boolean value to show wether the app has home acces
    // or not, and will be able to request home api.
    this.handleCheckRights = function(response) {
        this.sensor.testHomeCapabilities((success) => {
            response.status(200)
            response.send(success)
        })
    }

    // > [GET] host:port/api/fbx/auth
    // Will return a boolean value to show wether the app has been auth
    // or not on freebox os.
    this.handleAuth = function(response) {
        this.freeboxRequest.freeboxAuth(null, null, (token, sessionToken, trackId, challenge) => {
            credentials.update(token, trackId, (success) => {
                response.status(200)
                response.send(sessionToken != null)
            })
        })
    }

    // ------------
    // Homebridge
    // ------------

    // > [GET] host:port/api/homebridge/restart
    // Simply restart homebridge services via a kill command on the pm2
    // homebridge process.
    this.handleHomebridgeRestart = function(response) {
        homebridgeUtils.restart((success) => {
            response.status(200)
            response.send(success)
        })
    }

    // > [GET] host:port/api/homebridge/conf
    // Load a homebridge configuration file with the available nodes.
    // Returns a boolean value as a success value.
    this.handleHomebridgeConf = function(response) {
        let homebridgeConf = new HomebridgeConf(this.sensor)
        let config = {
            alarmEnabled: false,
            cameraEnabled: false,
        }
        homebridgeConf.setup(config, (success) => {
            response.status(200)
            response.send(success)
        })
    }

    // > [GET] host:port/api/homebridge/conf/alarm
    // Load a homebridge configuration file with the available nodes,
    // including the alarm.
    // Returns a boolean value as a success value.
    this.handleHomebridgeConfWithAlarm = function(response) {
        let homebridgeConf = new HomebridgeConf()
        homebridgeConf.setup((success) => {
            response.status(200)
            response.send(success)
        })
    }

    // > [GET] host:port/api/homebridge/clean
    // Removes the homebridge persist file, to be able ro re-pair with
    // a new HomeKit app (attached to another iCloud account).
    // Returns a boolean value as a success value.
    this.handleHomebridgeClean = function(response) {
        homebridgeUtils.clean((success) => {
            response.status(200)
            response.send(success)
        })
    }

    // ------------
    // Nodes
    // ------------

    // > [GET] host:port/api/node/list
    // Returns the list of the available nodes (only ids).
    // Will be called only from localhost.
    this.handleNodeList = function(response) {
        this.sensor.getNodeList((list) => {
            var nodes = []
            for (item of list) {
                let node = {
                    id: item.id,
                    type: item.type
                }
                nodes.push(node)
            }
            response.status(200)
            response.json(nodes)
        })
    }

    // > [GET] host:port/api/node/:id
    // Get the status of a node by it's id.
    // This will be the method used by homebridge.
    // Will be called only from localhost.
    this.handleNodeStatus = function(id, response) {
        this.sensor.getNodeStatus(id, (status) => {
            response.status(200)
            response.send(status)
        })
    }

    // ------------
    // Alarm
    // ------------

    // TODO : Add alarm requests

    // ------------
    // Logs
    // ------------

    // These are various methods to get logs for troubleshooting purpose.

    // > [GET] host:port/api/log/server
    this.handleServerLogs = function(response) {
        let logs = new Logs()
        logs.getServerLogs((logs) => {
            response.status(200)
            response.send(logs)
        })
    }

    // > [GET] host:port/api/log/homebridge
    this.handleHomebridgeLogs = function(response) {
        let logs = new Logs()
        logs.getHomebridgeLogs((logs) => {
            response.status(200)
            response.send(logs)
        })
    }

    // > [GET] host:port/api/log/server/error
    this.handleServerErrorLogs = function(response) {
        let logs = new Logs()
        logs.getServerErrorLogs((logs) => {
            response.status(200)
            response.send(logs)
        })
    }

    // > [GET] host:port/api/log/homebridge/error
    this.handleHomebridgeErrorLogs = function(response) {
        let logs = new Logs()
        logs.getHomebridgeErrorLogs((logs) => {
            response.status(200)
            response.send(logs)
        })
    }
}