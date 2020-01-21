let request = require('./../network/request')

var auth = {
	challenge: null,
	session: null,
	trackId: null,
	token: null
}

module.exports.nodeList = function(filter, callback) {
	if(auth.session) {
		let url = 'http://mafreebox.freebox.fr/api/v6/home/nodes'
		authRequest('GET', url, {}, (statusCode, body) => {
			console.log(body)
			let list = []
			callback(list)
		})
	} else {
		console.log('No session running')
	}
}

module.exports.nodeStatus = function(id, callback) {
	let status = 0
	callback(status)
}

module.exports.activateMainAlarm = function(callback) {
	let success = true
	callback(success)
}

module.exports.activateSecondaryAlarm = function(callback) {
	let success = true
	callback(success)
}

module.exports.deactivateAlarm = function(callback) {
	let success = true
	callback(success)
}

module.exports.alarmState = function(callback) {
	let state = 3
	callback(state)
}

module.exports.alarmTargetState = function(callback) {
	let state = 3
	callback(state)
}

// Will be called by every auth request that will need to update auth values.
function updateAuth(new_session, new_challenge, token, trackId) {
	if (auth.session != new_session) {
		console.log("[-] renewed session  : "+new_session)
		auth.session = new_session
		auth.challenge = new_challenge
		auth.token = token
		auth.trackId = trackId
	}
}

function authRequest(method, url, body, callback) {
	if(auth.challenge != null && auth.session != null) {
		request.freeboxRequest(method, url, body, auth, callback, updateAuth)
	}
}

module.exports.updateAuth = updateAuth