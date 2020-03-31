let request = require('request')

module.exports = function() {
    this.init = function(freeboxRequest, callback) {
        this.freeboxRequest = freeboxRequest
        this.listCamera((cameras) => {
            this.list = cameras
            this.activateNext((done) => {
                callback(done, this.list)
            })
        })
    }

    this.list = []
    this.i = -1

    this.activateNext = function(callback) {
        if (this.list != null) {
            this.i ++
            let cam = this.list[this.i]
            if (cam != null) {
                console.log('[i] Activating camera '+cam.id+' (at '+cam.ip+')')
                this.activateRTSP(cam, (success) => {
                    console.log('[i] Done activating '+cam.id)
                    this.activateNext(callback)
                })
            } else {
                console.log('[i] Done activating cameras')
                callback(true)
                this.i = 0
            }
        }
    }

    this.listCamera = function(callback) {
        let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
        this.freeboxRequest.request('GET', url, null, (statusCode, body) => {
            if (body != null) {
                if (body.success == true) {
                    var camList = []
                    for(node of body.result) {
                        if (node.category == 'camera') {
                            let cam = {
                                id: node.id,
                                password: node.props.Pass,
                                login: node.props.Login,
                                ip: node.props.Ip,
                                node_data: node
                            }
                            camList.push(cam)
                        }
                    }
                    this.list = camList
                    callback(camList)
                } else {
                    console.log('[!] Got a '+statusCode+', unable to request : '+url)
                    console.log(body)
                    callback(null)
                }
            } else {
                console.log('[!] Got a '+statusCode+', unable to request : '+url)
                callback(null)
            }
        }, true)
    }

    this.activateRTSP = function(camera, callback) {
        let url = 'http://'+camera.login+':'+camera.password+'@'+camera.ip+'/adm/set_group.cgi?group=H264&sp_uri=live'
        console.log('[i] Requesting '+url)
        request(url, function (error, response, body) {
            if(body == 'OK') {
                callback(true)
            } else {
                callback(false)
            }
        })
    }
}