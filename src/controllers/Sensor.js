// Node Controller
module.exports = function() {
    this.storedNodeList = []
    this.storedStatus = []

    this.init = function(freeboxRequest) {
        this.freeboxRequest = freeboxRequest
        this.getNodeList((list) => {
            this.refreshStatus()
        })
    }

    this.refreshStatus = function() {
        if (this.storedNodeList != null && this.storedNodeList.length != 0) {
            var requestData = []
            for (node of this.storedNodeList) {
                if (node.statusId != null) {
                    let data = {
                        node: node.id,
                        ep: node.statusId
                    }
                    requestData.push(data)
                }
            }
            var self = this
            let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/get'
            this.freeboxRequest.request('POST', url, requestData, (statusCode, data) => {
                if (data != null) {
                    if (data.success == true) {
                        if (data.result != null) {
                            this.storedStatus = []
                            var index = 0
                            for (status of data.result) {
                                var statusData = 0
                                if (status.value == false) {
                                    statusData = 1
                                }
                                let nodeId = requestData[index].node
                                let nodeStatus = statusData
                                this.storedStatus.push({
                                    id: nodeId,
                                    status: nodeStatus
                                })
                                index = index + 1
                            }
                        }
                    }
                } else {
                    console.log('[!] Unable to recover status for nodes. Got a null response ('+statusCode+')')
                }
                setTimeout(function() {
                    //console.log(this.storedStatus)
                    self.refreshStatus()
                }, 1000)
            }, false)
        } else {
            this.getNodeList((list) => { })
            var self = this
            setTimeout(function() {
                self.refreshStatus()
            }, 1000)
        }
    }

    this.testHomeCapabilities = function(callback) {
        let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
        this.freeboxRequest.request('GET', url, null, (statusCode, data) => {
            if(statusCode == 401) {
                callback(false)
            } else {
                callback(true)
            }
        }, false)
    }

    this.getNodeList = function(callback) {
        let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
        this.freeboxRequest.request('GET', url, null, (statusCode, body) => {
            if (body != null) {
                if (body.success == true) {
                    var nodeList = []
                    for(node of body.result) {
                        var endpointForStatus = null
                        for(endpoint of node.show_endpoints) {
                            if(endpoint.name == 'trigger') {
                                endpointForStatus = endpoint.id
                            }
                        }
                        let item = {
                            id: node.id,
                            type: node.category,
                            label: this.getObjectLabel(node, nodeList),
                            statusId: endpointForStatus,
                            data: node
                        }
                        nodeList.push(item)
                    }
                    this.storedNodeList = nodeList
                    callback(nodeList)
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

    this.getNodeListFiltred = function(filter, callback) {
        let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
        this.freeboxRequest.request('GET', url, null, (statusCode, body) => {
            if (body != null) {
                if (body.success == true) {
                    var nodeList = []
                    for(node of body.result) {
                        if(filter != null) {
                            if(node.category == filter) {
                                var endpointForStatus = null
                                for(endpoint of node.show_endpoints) {
                                    if(endpoint.name == 'trigger') {
                                        endpointForStatus = endpoint.id
                                    }
                                }
                                let item = {
                                    id: node.id,
                                    type: node.category,
                                    label: this.getObjectLabel(node, nodeList),
                                    statusId: endpointForStatus,
                                    data: node
                                }
                                nodeList.push(item)
                            }
                        }
                    }
                    callback(nodeList)
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

    this.getObjectLabel = function(object, objects) {
        var label = object.label
        if (this.objectLabelIsDuplicated(object.label, object.id, objects)) {
            let index = 2
            label = object.label + ' ' + index
            while (this.objectLabelIsDuplicated(label, object.id, objects)) {
                label = object.label + ' ' + (index + 1)
            }
        }
        return label
    }

    this.objectLabelIsDuplicated = function(label, id, objects) {
        for (object of objects) {
            if ((label == object.label) && (id != object.id)) {
                return true
            }
        }
        return false
    }

    this.retreiveNodeFromList = function(callback) {
        if(list) {
            for(currentNode of list) {
                if(currentNode.id == id) {
                    return currentNode
                }
            }
        } else {
            return null
        }
    }

    this.getNodeStatus = function(id, callback) {
        if (this.storedStatus != null && this.storedStatus.length != 0) {
            for (node of this.storedStatus) {
                if (node.id == id) {
                    callback(node.status.toString())
                    return
                }
            }
        }
        callback('')
    }
}