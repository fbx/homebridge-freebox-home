let request = require("./../network/request.js")
let crypto = require("crypto-js")

// will try every RETRY_TIMEOUT with a delay of RETRY_COUNT
const RETRY_COUNT   = 30
const RETRY_TIMEOUT = 2000 // 2 seconds


var accessAttemptCount = 0
var sessionAttemptCount = 0

// Setup the complete auth process.
// This method is exposed and will be called when the server starts.
function fbx(token, trackId, callback) {
	if ((token == null || token == 'null') || (trackId == null || trackId == 'null')) {
		auth((new_token, new_trackId) => {
			if(new_token != null && new_trackId != null) {
				start(new_token, new_trackId, (challenge, sessionToken) => {
					if (challenge != null || sessionToken != null) {
						callback(new_token, sessionToken, new_trackId, challenge)	
					} else {
						console.log('>>> challenge or session is null')
						callback(null, null, null, null)
					}
				})
			} else {
				console.log('>>> token or trackid is null')
				callback(null, null, null, null)
			}
		})
	} else {
		console.log("[i] Starting session with existing token")
		start(token, trackId, (challenge, sessionToken) => {
			if(challenge != null && sessionToken != null) {
				callback(token, sessionToken, trackId, challenge)
			} else {
				console.log('>>> challenge or session is null, with existing track/token')
				callback(null, null, null, null)
			}
		})
	}
}

// Get a token and a trackId.
function auth(callback) {
	let url = 'http://mafreebox.freebox.fr/api/v6/login/authorize/'
	let data = {
		"app_id":"hb.fbx-home",
		"app_name":"Homebridge-Freebox",
		"app_version":"1.0",
		"device_name":"server"
	}
	let header = { }
	request.basicRequest('POST', url, header, data, (statusCode, body) => {
		if(body != null) {
			let trackId = body.result.track_id
			let token = body.result.app_token
			callback(token, trackId)
		} else {
			callback(null, null)
		}
	})
}

// Start a session with a token and a trackId.
function start(token, trackId, callback) {
	grantAccess(trackId, (accessGranted, challenge) => {
		if (accessGranted == 1) {
			accessAttemptCount = 0
			if (token != null || challenge != null) {
				session(token, challenge, (sessionToken) => {
					callback(challenge, sessionToken)
				})
			} else {
				setTimeout(function() {
					console.log('>>> challenge or token is null')
					start(token, trackId, callback)
				}, RETRY_TIMEOUT)
			}
		}
		if (accessGranted == 0) {
			console.log("[i] Operation canceled after "+accessAttemptCount+" attempt, access has not been granted")
			sessionAttemptCount = 0
			callback(null, null)
		}
		if (accessGranted == 2) {
			setTimeout(function() {
				if (accessAttemptCount < Number.MAX_SAFE_INTEGER) {
					accessAttemptCount++;
					console.log("[i] Trying again, attempt "+accessAttemptCount)
					start(token, trackId, callback)
				} else {
					console.log("[i] Operation canceled after "+accessAttemptCount+" attempt")
					sessionAttemptCount = 0
					callback(null, null)
				}
			}, RETRY_TIMEOUT)
		}
	})
}

// Check for the access to be granted (user has taped the check mark on the box).
function grantAccess(trackId, callback) {
	let url = 'http://mafreebox.freebox.fr/api/v6/login/authorize/'+trackId
	request.basicRequest('GET', url, {}, {}, (statusCode, body) => {
		if (body != null && body.result != null) {
			if (body.result.status == 'granted') {
				callback(1, body.result.challenge)
			} else if(body.result.status == 'pending') {
				console.log("[!] Pending access, check your box")
				callback(2, null)
			} else {
				console.log("[!] Access denied")
				callback(0, null)
			}
		} else {
			console.log("[!] Unable to check access")
			callback(0, null)
		}
	})
}

// Request a session with a token and a challenge.
// This method is exposed and will be called whenever the session needs to be renewed.
function session(token, challenge, callback) {
	if(challenge == null || token == null) {
		console.log("[i] Operation canceled : token and/or challenge doesn't seem good")
		callback(null)
	} else {
		const password = crypto.HmacSHA1(challenge, token).toString()
		let url = 'http://mafreebox.freebox.fr/api/v6/login/session'
		let header = {
			"X-Fbx-App-Auth": token
		}
		let data = {
			"app_id": "hb.fbx-home",
			"app_version": "1.0",
			"password": password
		}
		request.basicRequest('POST', url, header, data, (statusCode, body) => {
			if (body.success == false) {
				console.log("[!] Unable to start session")
				setTimeout(function() {
					if (sessionAttemptCount < RETRY_COUNT) {
						sessionAttemptCount++;
						console.log("[i] Trying again, attempt "+sessionAttemptCount)
						session(token, body.result.challenge, callback)
					} else {
						console.log("[i] Operation canceled after "+sessionAttemptCount+" attempt")
						callback(null)
					}
				}, RETRY_TIMEOUT)
			} else {
				sessionAttemptCount = 0
				console.log("[i] Session started")
				callback(body.result.session_token)
			}
		})
	}
}

module.exports.fbx = fbx
module.exports.session = session