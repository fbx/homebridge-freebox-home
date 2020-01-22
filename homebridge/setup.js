let fbxHome = require('./../fbx-home/fbx-home')

module.exports.setupHomebridge = function(callback) {
    const homedir = require('os').homedir()
    let file = homedir+'/.homebridge/config.json'
    const fs = require('fs')
    if(!fs.existsSync(file)) {
        callback(false)
        return
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