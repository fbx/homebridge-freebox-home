let fbxHome = require('./../fbx-home/fbx-home')
let fs = require('fs')


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

function getAccessories(callback) {
    var accessories = []
    DWSItems((dwss) => {
        PIRItems((pirs) => {
            for(dws of dwss) {
                accessories.push(dws)
            }
            for(pir of pirs) {
                accessories.push(pir)
            }
            callback(accessories)
        })
    })
}

function DWSItems(callback) {
    fbxHome.getNodeList("dws", (list) => {
        var accessories = []
        for(node of list) {
            accessories.push(buildAccessory(node))
        }
        callback(accessories)
    })
}

function PIRItems(callback) {
    fbxHome.getNodeList("pir", (list) => {
        var accessories = []
        for(node of list) {
            accessories.push(buildAccessory(node))
        }
        callback(accessories)
    })
}

function buildAccessory(node) {
    let type = node.type == 'pir' ? 'motion-sensor' : 'ContactSensor'
    return {
        accessory: type,
        name: node.label,
        pollInterval: 500,
        statusUrl: 'http://localhost:8888/api/node/'+node.id
    }
}

function createEmptyConfigFile(dir) {
    let data = {
            "bridge": {
                "name": "Homebridge",
                "username": "CC:22:3D:E3:CE:30",
                "port": 51826,
                "pin": "031-45-154"
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