let request = require('./../network/request')
let nodes = require('./nodes')
let sensors = require('./sensors')
let alarm = require('./alarm')

var auth = {
	challenge: null,
	session: null,
	trackId: null,
	token: null
}

var local_node_list = null
var local_alarm_target = 0

updateAlarmTarget()

function updateAlarmTarget() {
	if(auth.session) {
		this.getAlarm((alarm_node) => {
			let ep_id = alarm.alarmStateId(alarm_node.data)
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
			authRequest('GET', url, null, (statusCode, body) => {
				if(body != null) {
					if(body.success == true) {
						switch(body.result.value) {
							case 'idle':
								local_alarm_target = 0
								break
							case 'alarm1_armed':
								local_alarm_target = 1
								break
							case 'alarm2_armed':
								local_alarm_target = 2
								break
							default:
								local_alarm_target = 0
								break
						}
					}
				}
				setTimeout(function() {
					updateAlarmTarget()
				}, 10000)
			})
		})
	}
}

module.exports.getNodeList = function(filter, callback) {
	if(auth.session) {
		let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
		authRequest('GET', url, null, (statusCode, body) => {
			if(body != null) {
				if(body.success == true) {
					let list = nodes.nodeList(body, filter)
					local_node_list = list
					callback(list)
				} else {
					console.log(body)
					callback(null)
				}
			} else {
				console.log('[!] Unable to request home API')
				callback(null)
			}
		})
	} else {
		console.log('[>] No session running')
		callback(null)
	}
}

module.exports.getNode = function(id, callback) {
	if(local_node_list != null) {
		let node = nodes.retrieveNode(id, local_node_list)
		if(node != null) {
			callback(node)
			return
		}
	}
	if(auth.session) {
		let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes/'+id
		authRequest('GET', url, null, (statusCode, body) => {
			if(body != null) {
				if(body.success == true) {
					let node = nodes.node(body)
					callback(node)
				} else {
					console.log(body)
					callback(null)
				}
			} else {
				console.log('[!] Unable to request home API')
				callback(null)
			}
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.nodeStatus = function(id, callback) {
	if(auth.session) {
		this.getNode(id, (node) => {
			if (node == null) {
				console.log('[!] Requested status for a non-sensor node.')
				callback(null)
				return
			}
			if (node.type != 'dws' && node.type != 'pir') {
				console.log('[!] Requested status for an inexistant node.')
				callback(null)
				return
			}
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+id+'/'+node.statusId
			authRequest('GET', url, null, (statusCode, body) => {
				if(body != null) {
					if(body.success == true) {
						let status = sensors.sensorStatus(body)
						callback(status)
					} else {
						console.log(body)
						callback(null)
					}
				} else {
					console.log('[!] Unable to request home API')
					callback(null)
				}
			})
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.getAlarm = function(callback) {
	if(auth.session) {
		let alarm_node = null
		if(local_node_list != null) {
			alarm_node = nodes.retrieveAlarmNode(local_node_list)
		}
		if(alarm_node == null) {
			this.getNodeList("alarm", (list) => {
				if(list.length > 0) {
					callback(list[0])
				} else {
					callback(null)
				}
			})
		} else {
			callback(alarm_node)
		}
	} else {
		console.log('No session running')
		callback(null)
	}
	
}

module.exports.activateMainAlarm = function(callback) {
	if(auth.session) {
		this.getAlarm((alarm_node) => {
			let ep_id = alarm.mainAlarmRequestId(alarm_node.data)
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
			let data = {
				id: alarm_node.id,
				value: null
			}
			local_alarm_target = 1
			authRequest('PUT', url, data, (statusCode, body) => {
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
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.checkAlarmActivable = function(callback) {
	this.alarmState((state) => {
		if(state != 'idle') {
			this.deactivateAlarm((success) => {
				callback(success)
			})
		} else {
			callback(true)
		}
	})
}

module.exports.activateSecondaryAlarm = function(callback) {
	if(auth.session) {
		this.checkAlarmActivable((activable) => {
			if(activable) {
				this.getAlarm((alarm_node) => {
					let ep_id = alarm.secondaryAlarmRequestId(alarm_node.data)
					let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
					let data = {
						id: alarm_node.id,
						value: null
					}
					local_alarm_target = 2
					authRequest('PUT', url, data, (statusCode, body) => {
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
				})
			} else {
				callback(null)
			}
		})
		
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.deactivateAlarm = function(callback) {
	if(auth.session) {
		this.getAlarm((alarm_node) => {
			let ep_id = alarm.alarmOffId(alarm_node.data)
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
			let data = {
				id: alarm_node.id,
				value: null
			}
			local_alarm_target = 0
			authRequest('PUT', url, data, (statusCode, body) => {
				if(body != null) {
					if(body.success == true) {
						callback(true)
					} else {
						console.log(body)
						callback(null)
					}
				} else {
					console.log('[!] Unable to request home API')
					callback(null)
				}
			})
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.homeAlarm = function(callback) {
	if(auth.session) {
		this.getAlarm((alarm_node) => {
			let ep_id = alarm.alarmOffId(alarm_node.data)
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
			let data = {
				id: alarm_node.id,
				value: null
			}
			local_alarm_target = 3
			authRequest('PUT', url, data, (statusCode, body) => {
				if(body != null) {
					if(body.success == true) {
						callback(true)
					} else {
						console.log(body)
						callback(null)
					}
				} else {
					console.log('[!] Unable to request home API')
					callback(null)
				}
			})
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.alarmState = function(callback) {
	if(auth.session) {
		this.getAlarm((alarm_node) => {
			let ep_id = alarm.alarmStateId(alarm_node.data)
			let url = 'http://mafreebox.freebox.fr/api/v6/home/endpoints/'+alarm_node.id+'/'+ep_id
			authRequest('GET', url, null, (statusCode, body) => {
				if(body != null) {
					if(body.success == true) {
						if (body.result.value == 'alert') {
							local_alarm_target = 0
						}
						callback(body.result.value, local_alarm_target)
					} else {
						console.log(body)
						callback(null)
					}
				} else {
					console.log('[!] Unable to request home API')
					callback(null)
				}
			})
		})
	} else {
		console.log('No session running')
		callback(null)
	}
}

module.exports.alarmTargetState = function(callback) {
	callback(local_alarm_target)
}

module.exports.testHomeCapabilities = function(callback) {
	let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
	request.freeboxRequest('GET', url, null, auth, (statusCode, body) => {
		if(statusCode == 401) {
			callback(false)
		} else {
			callback(true)
		}
	}, updateAuth, false)
}

// Will be called by every auth request that will need to update auth values.
function updateAuth(new_session, new_challenge, token, trackId) {
	if (token == null) {
		console.log('[!] Credentials trying updating with a null token')
		return
	}
	if (auth.session != new_session) {
		console.log("[-] renewed session  : "+new_session)
	}
	auth.session = new_session
	auth.challenge = new_challenge
	auth.token = token
	auth.trackId = trackId
}

function authRequest(method, url, body, callback) {
	if(auth.challenge != null && auth.session != null && auth.token != null) {
		request.freeboxRequest(method, url, body, auth, callback, updateAuth, true)
	}
}

module.exports.updateAuth = updateAuth