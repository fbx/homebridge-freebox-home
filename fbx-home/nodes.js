module.exports.completeNodeList = function(object) {
	return nodeList(object, null)
}

module.exports.nodeList = function(object, filter) {
	if(object.success == true) {
		var items = []
		for(node of object.result) {
			var endpointForStatus = null
			for(endpoint of node.show_endpoints) {
				if(endpoint.name == 'trigger') {
					endpointForStatus = endpoint.id
				}
			}
			let item = {
				id: node.id,
				type: node.category,
				label: node.label,
				statusId: endpointForStatus,
				data: node
			}
			if(filter != null) {
				if(item.type == filter) {
					items.push(item)
				}
			} else {
				items.push(item)
			}
		}
		return items
	} else {
		return null
	}
}

module.exports.node = function(object) {
	if(object.success == true) {
		var endpointForStatus = null
		for(endpoint of object.result.show_endpoints) {
			if(endpoint.name == 'trigger') {
				endpointForStatus = endpoint.id
			}
		}
		let item = {
			id: object.result.id,
			type: object.result.category,
			label: object.result.label,
			statusId: endpointForStatus
		}
		return item
	} else {
		return null
	}
}

module.exports.retrieveNode =  function(id, list) {
	if(list) {
		for(node of list) {
			if(node.id == id) {
				return node
			} else {
				return null
			}
		}
	} else {
		return null
	}
}

module.exports.retrieveAlarmNode = function(list) {
	if(list) {
		for(node of list) {
			if(node.type == "alarm") {
				return node
			} else {
				return null
			}
		}
	} else {
		return null
	}
}