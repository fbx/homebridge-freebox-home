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
		return []
	}
}