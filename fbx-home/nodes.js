module.exports.completeNodeList = function(object) {
	return nodeList(object, null)
}

module.exports.nodeList = function(object, filter) {
	if(object.success == true) {
		var items = []
		for(node of object.result) {
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
						label: getObjectLabel(node, items),
						statusId: endpointForStatus,
						data: node
					}
					items.push(item)
				}
			} else {
				var endpointForStatus = null
				for(endpoint of node.show_endpoints) {
					if(endpoint.name == 'trigger') {
						endpointForStatus = endpoint.id
					}
				}
				let item = {
					id: node.id,
					type: node.category,
					label: getObjectLabel(node, items),
					statusId: endpointForStatus,
					data: node
				}
				items.push(item)
			}
		}
		return items
	} else {
		return null
	}
}

function getObjectLabel(object, objects) {
	var label = object.label
	if (objectLabelIsDuplicated(object.label, object.id, objects)) {
		let index = 2
		label = object.label + ' ' + index
		while (objectLabelIsDuplicated(label, object.id, objects)) {
			label = object.label + ' ' + (index + 1)
		}
	}
	return label
}

function objectLabelIsDuplicated(label, id, objects) {
	for (object of objects) {
		if ((label == object.label) && (id != object.id)) {
			return true
		}
	}
	return false
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
		for(currentNode of list) {
			if(currentNode.id == id) {
				return currentNode
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