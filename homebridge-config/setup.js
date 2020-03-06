let fbxHome = require('../fbx-home/fbx-home')
let fs = require('fs')
let request = require('request')

const RETRY_TIMEOUT = 2000 // 2 seconds

var camEnabled = false

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

        getAccessories((accessories) => {
            config.accessories = []
            for(accessory of accessories) {
                config.accessories.push(accessory)
            }
            getPlatforms((cameras) => {
                config.platforms = []
                for(camera of cameras) {
                    config.platforms.push(camera)
                }
                fs.writeFile(file, JSON.stringify(config), (err) => {
                    if (err) {
                        console.log(err)
                    }
                    callback(true)
                })
            })
        })
    })
}

function activateRTSP(cameraIndex, cameraList) {
    let cam = cameraList[cameraIndex]
    console.log('Activating rtsp for camera '+cam.ip)
    request('http://'+cam.login+':'+cam.password+'@'+cam.ip+'/adm/set_group.cgi?group=H264&sp_uri=rocket', function (error, response, body) {
        console.log(body)
        if(body == 'OK') {
            if(cameraList.length < cameraIndex) {
                let nextIndex = cameraIndex + 1
                activateRTSP(nextIndex, cameraList)
            }
        }
    })
}

module.exports.cleanHomebridge = function(callback) {
    const { exec } = require("child_process");
    let command = 'rm /root/.homebridge/persist/*'
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

module.exports.reloadHomebridge = function(callback) {
    let pm2Dir = '/etc/.pm2/pm2.pid'
    if(fs.existsSync(pm2Dir)) {
        fs.readFile('/etc/.pm2/pids/homebridge-0.pid', (err, data) => {
            if (err == null) {
                const { exec } = require("child_process");
                let command = 'sudo kill -KILL ' + data
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
    } else {
        callback(false)
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
        pollInterval: Math.floor(Math.random() * (1500 - 500 + 1) + 500),
        statusUrl: 'http://localhost:8888/api/node/'+node.id
    }
}

function getPlatforms(callback) {
    var platforms = []
    var cams = []
    cameraItems((cameras) => {
        for (camera of cameras) {
            if (camera.data.props.Ip != '0.0.0.0') {
                platforms.push(buildCameraPlateform(camera))
                cams.push({
                    ip: camera.data.props.Ip,
                    login: camera.data.props.Login,
                    password: camera.data.props.Pass
                })
            }
        }
        if(camEnabled) {
            activateRTSP(0, cams)
            callback(platforms)
        } else {
            callback([])
        }
    })
}

function cameraItems(callback) {
    fbxHome.getNodeList('camera', (list) => {
        callback(list)
    })
}

function buildCameraPlateform(node) {
    return {
        "name": node.data.label,
        "videoConfig": {
            "source": '-re -i rtsp://'+node.data.props.Ip+'/rocket',
            "maxStreams": 2,
            "maxWidth": 1280,
            "maxHeight": 720,
            "maxFPS": 10,
            "maxBitrate": 300,
            "packetSize": 1316,
            "audio": true,
            "debug": true
        }
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
        if(list != null && isIterable(list)) {
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
                getAccessoryOfType(type, callback)
			}, RETRY_TIMEOUT)
        }
    })
}

function randomHex(len) {
    var maxlen = 8,
        min = Math.pow(16,Math.min(len,maxlen)-1) 
        max = Math.pow(16,Math.min(len,maxlen)) - 1,
        n = Math.floor(Math.random() * (max-min+1)) + min,
        r = n.toString(16);
    while (r.length < len) {
       r = r + randHex(len - maxlen)
    }
    return r
}

function createEmptyConfigFile(dir) {
    var mac = randomHex(2)
    for (var j = 1;j<6;j++) {
        mac = mac + ':' + randomHex(2);
    }
    mac = mac.toUpperCase()
    let data = {
            "bridge": {
                "name": "Freebox Homebridge",
                "username": "CC:22:3D:E3:CE:32",
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