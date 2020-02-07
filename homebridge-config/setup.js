let fbxHome = require('../fbx-home/fbx-home')
let fs = require('fs')

const RETRY_TIMEOUT = 2000 // 2 seconds

module.exports.setupHomebridge = function(callback) {
    const homedir = require('os').homedir()
    let file = homedir+'/.homebridge/config.json'
    if(!fs.existsSync(file)) {
        createEmptyConfigFile(file)
    }
    fs.readFile(file, (err, data) => {
        if(err) {
            console.log(err)
        }
        let config = JSON.parse(data)

        getAccessories((list) => {
            config.accessories = []
            for(accessory of list) {
                config.accessories.push(accessory)
            }
            fs.writeFile(file, JSON.stringify(config), (err) => {
                if (err) {
                    console.log(err)
                }
                callback(true)
            });
        })
    })
}

module.exports.reloadHomebridge = function(callback) {
    let pm2Dir = '/etc/.pm2/pm2.pid'
    if(fs.existsSync(pm2Dir)) {
        fs.readFile('/etc/.pm2/pids/homebridge-0.pid', (err, data) => {
            if (err == null) {
                const { exec } = require("child_process");
                let command = 'sudo kill -KILL' + data
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`)
                        callback(false)
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`)
                        callback(false)
                    }
                    console.log(`stdout: ${stdout}`)
                    callback(true)
                })
            }
        })
    }
}

function getAccessories(callback) {
    var accessories = []
    DWSItems((dwss) => {
        PIRItems((pirs) => {
            AlarmItems((alarms) => {
                for(alarm of alarms) {
                    accessories.push(alarm)
                }
                for(dws of dwss) {
                    accessories.push(dws)
                }
                for(pir of pirs) {
                    accessories.push(pir)
                }
                callback(accessories)
            })
        })
    })
}

function DWSItems(callback) {
    getAccessoryOfType('dws', callback)
}

function PIRItems(callback) {
    getAccessoryOfType('pir', callback)
}

function AlarmItems(callback) {
    getAccessoryOfType('alarm', callback)
}

function buildSensorAccessory(node) {
    let type = node.type == 'pir' ? 'motion-sensor' : 'ContactSensor'
    return {
        accessory: type,
        name: node.label,
        pollInterval: 500,
        statusUrl: 'http://localhost:8888/api/node/'+node.id
    }
}

function buildAlarmAccessory(node) {
    let alarm = {
        accessory: "Http-SecuritySystem",
        name: "Alarme",
        username: "",
        password: "",
        immediately: false,
        polling: true,
        pollInterval: 3000,
        http_method: 'POST',
        urls: {
            "stay": {
                "url": "http://localhost:8888/api/alarm/home",
                "body": null
            },
            "away": {
                "url": "http://localhost:8888/api/alarm/main",
                "body": null
            },
            "night": {
                "url": "http://localhost:8888/api/alarm/secondary",
                "body": null
            },
            "disarm": {
                "url": "http://localhost:8888/api/alarm/off",
                "body": null
            },
            "readCurrentState": {
                "url": "http://localhost:8888/api/alarm/state",
                "body": null
            },
            "readTargetState": {
                "url": "http://localhost:8888/api/alarm/target",
                "body": null,
                "headers": {
                    "Content-Type": "text/html"
                }
            }
        }
    }
    return alarm
}

function isIterable(obj) {
    if (obj == null) {
        return false
    }
    return typeof obj[Symbol.iterator] === 'function'
}

function getAccessoryOfType(type, callback) {
    fbxHome.getNodeList(type, (list) => {
        if(isIterable(list)) {
            var accessories = []
            for(node of list) {
                if(type == 'alarm') {
                    accessories.push(buildAlarmAccessory(node))
                } else {
                    accessories.push(buildSensorAccessory(node))
                }
            }
            callback(accessories)
        } else {
            setTimeout(function() {
				DWSItems(callback)
			}, RETRY_TIMEOUT)
        }
    })
}

function createEmptyConfigFile(dir) {
    let data = {
            "bridge": {
                "name": "Freebox Homebridge",
                "username": "CC:22:3D:E3:CE:30",
                "port": 51826,
                "pin": "123-45-678"
            },
            "description": "Homebridge configuration file.",
            "ports": {
                "start": 52100,
                "end": 52150,
                "comment": "This section is used to control the range of ports that separate accessory (like camera or television) should be bind to."
            },
            "accessories": [],
            "platforms": []
        }
    fs.writeFileSync(dir, JSON.stringify(data));
    console.log('[i] Homebridge config file created')
}