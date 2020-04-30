// Alarm Controller
module.exports = function() {
    this.storedAlarmTarget = 0
    this.storedAlarmNode = null
    this.isArming = false

    this.init = function(freeboxRequest) {
        this.freeboxRequest = freeboxRequest
        this.getAlarm((alarm) => {
            this.storedAlarmNode = alarm
            this.refreshAlarmTarget()
        })
    }

    this.getAlarm = function(callback) {
        let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
        this.freeboxRequest.request('GET', url, null, (statusCode, body) => {
            if (body != null) {
                if (body.success == true) {
                    for(node of body.result) {
                        if (node.category == 'alarm') {
                            this.storedAlarmNode = node
                            callback(node)
                        }
                    }
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

    this.refreshAlarmTarget = function() {
        if (this.storedAlarmNode != null) {
            let ep_id = this.getStateEndpoint()
            let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+this.storedAlarmNode.id+'/'+ep_id
            this.freeboxRequest.request('GET', url, null, (statusCode, body) => {
                if(body != null) {
                    if(body.success == true) {
                        if (body.result.value.includes('alarm1')) {
                            this.storedAlarmTarget = 1
                        } else if (body.result.value.includes('alarm2')) {
                            this.storedAlarmTarget = 2
                        } else if (body.result.value.includes('alert')) {
                        //     this.storedAlarmTarget = 4
                        } else {
                            this.storedAlarmTarget = 0
                        }
                        // console.log('>>> [ALARM] refresehd '+body.result.value+' : '+this.storedAlarmTarget)
                    }
                }
                self = this
                setTimeout(function() {
                    self.refreshAlarmTarget()
                }, 10000)
            })
        } else {
            self = this
            setTimeout(function() {
                self.getAlarm((alarm) => {
                    self.storedAlarmNode = alarm
                    self.refreshAlarmTarget()
                })
            }, 10000)
        }
    }

    this.getMainEndpoint = function() {
        return this.getEndpointIdWithName('alarm1')
    }

    this.getSecondaryEndpoint = function() {
        return this.getEndpointIdWithName('alarm2')
    }

    this.getOffEndpoint = function() {
        return this.getEndpointIdWithName('off')
    }

    this.getStateEndpoint = function() {
        return this.getEndpointIdWithName('state')
    }

    this.getEndpointIdWithName = function(name) {
        if(this.storedAlarmNode != null) {
            var id = 0
            for(endpoint of this.storedAlarmNode.type.endpoints) {
                if(endpoint.name == name) {
                    return id
                } else {
                    id++
                }
            }
        }
    }

    this.checkAlarmActivable = function(target, callback) {
        if (this.storedAlarmNode != null) {
            if (this.isArming == false) {
                this.getAlarmState((state) => {
                    // console.log(state)
                    if(state.includes(target)) {
                        console.log('[i] About to active ['+target+'] while state is ['+state+']')
                        callback(false)
                        return
                    }
                    if(state != 'idle') {
                        this.setAlarmDisabled((success) => {
                            callback(success)
                        })
                    } else {
                        callback(true)
                    }
                })
            } else {
                callback(true)
            }
        } else {
            this.getAlarm((alarm) => {
                this.storedAlarmNode = alarm
                this.checkAlarmActivable(target, callback)
            })
        }
    }

    this.getAlarmState = function(callback) {
        if (this.storedAlarmNode != null) {
            let ep_id = this.getStateEndpoint()
            let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+this.storedAlarmNode.id+'/'+ep_id
            let data = {
                id: this.storedAlarmNode.id,
                value: null
            }
            this.freeboxRequest.request('GET', url, data, (statusCode, body) => {
                if(body != null) {
                    if(body.success == true) {
                        if (body.result.value.includes('alert')) {
                            //this.storedAlarmTarget = 4
                        }
                        if (body.result.value == 'alarm1_armed' || body.result.value == 'alarm1_arming') {
                            this.storedAlarmTarget = 1
                        }
                        if (body.result.value == 'alarm2_armed' || body.result.value == 'alarm2_arming') {
                            this.storedAlarmTarget = 2
                        }
                        if (body.result.value.includes('arming')) {
                            this.isArming = true
                        }
                        if (body.result.value.includes('armed')) {
                            this.isArming = false
                        }
                        callback(body.result.value)
                    } else {
                        callback(null)
                    }
                } else {
                    console.log('[!] Unable to request home API')
                    callback(null)
                }
            })
        } else {
            this.getAlarm((alarm) => {
                this.storedAlarmNode = alarm
                this.getAlarmState(callback)
            })
        }
    }

    this.getAlarmTarget = function(callback) {
        callback(this.storedAlarmTarget)
    }

    this.setAlarmDisabled = function(callback) {
        if (this.storedAlarmNode != null) {
            let ep_id = this.getOffEndpoint()
            let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+this.storedAlarmNode.id+'/'+ep_id
            let data = {
                id: this.storedAlarmNode.id,
                value: null
            }
            this.storedAlarmTarget = 0
            this.freeboxRequest.request('PUT', url, data, (statusCode, body) => {
                if(body != null) {
                    if(body.success == true) {
                        callback(true)
                    } else {
                        callback(null)
                    }
                } else {
                    console.log('[!] Unable to request home API')
                    callback(null)
                }
            })
        } else {
            callback(null)
        }
    }

    this.setAlarmMain = function(callback) {
        this.checkAlarmActivable('alarm1', (activable) => {
            if (activable) {
                if (this.storedAlarmNode != null) {
                    let ep_id = this.getMainEndpoint()
                    let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+this.storedAlarmNode.id+'/'+ep_id
                    let data = {
                        id: this.storedAlarmNode.id,
                        value: null
                    }
                    this.storedAlarmTarget = 1
                    this.freeboxRequest.request('PUT', url, data, (statusCode, body) => {
                        if(body != null) {
                            if(body.success == true) {
                                callback(true)
                            } else {
                                callback(null)
                            }
                        } else {
                            console.log('[!] Unable to request home API')
                            callback(null)
                        }
                    })
                } else {
                    callback(null)
                }
            } else {
                callback(null)
            }
        })
    }

    this.setAlarmSecondary = function(callback) {
        this.checkAlarmActivable('alarm2', (activable) => {
            if (activable) {
                if (this.storedAlarmNode != null) {
                    let ep_id = this.getSecondaryEndpoint()
                    let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+this.storedAlarmNode.id+'/'+ep_id
                    let data = {
                        id: this.storedAlarmNode.id,
                        value: null
                    }
                    this.storedAlarmTarget = 2
                    this.freeboxRequest.request('PUT', url, data, (statusCode, body) => {
                        if(body != null) {
                            if(body.success == true) {
                                callback(true)
                            } else {
                                callback(null)
                            }
                        } else {
                            console.log('[!] Unable to request home API')
                            callback(null)
                        }
                    })
                } else {
                    callback(null)
                }
            } else {
                callback(null)
            }
        })
    }
}
