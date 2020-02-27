let request = require('request')
let fbxAuth = require('./../fbx-auth/session')

const RETRY_TIMEOUT = 2000 // 2 seconds

// Used to launch a simple request.
// Callback will return the status code and the body.
function basicRequest(method, url, headers, body, callback) {
	const options = {
	    url: url,
	    method: method,
	    headers: headers,
	    json: true,
	    body: body
	}

	request(options, function(err, response, body) {
		if(response == null) {
			console.log(err)
			callback(null, null)
		} else {
			callback(response.statusCode, response.body)
		}
	})
}

var RETRY_COUNT = 0

// Used to launch a freebox authentified request.
// It will add the authentication header with the passed auth data,
// and use it to refresh the session if expired.
// Format for auth :
// {
// 		session: "...",
//      challenge: "...",
//		trackId: "...",
//		token: "..."
// }
// authCallback will return the renewed auth data if renewed
function freeboxRequest(method, url, body, auth, requestCallback, authCallback, autoRetry) {
	// console.log('url '+url)
	// console.log('meth '+method)
	// console.log('session '+auth.session)
	if (auth.token == null) {
		console.log('[!] Operation requested with null token')
		requestCallback(null, null)
		return
	}
	const options = {
	    url: url,
	    method: method,
	    headers: {
	    	'X-Fbx-App-Auth': auth.session
	    },
	    json: true,
	    body: body
	}

	request(options, function(err, response, body) {
		if(response == null) {
			console.log(err)
			requestCallback(null, null)
			return
		}
		// if the challenge has changed -> request new session token
		// returns the new auth stuff and retry the request
		if ((body.error_code != null && body.error_code == 'auth_required') && auth.challenge != body.result.challenge) {
			console.log('[i] Fbx authed operation requested without credentials')
			fbxAuth.session(auth.token, body.result.challenge, (new_sessionToken) => {
				if(new_sessionToken == null) {
					if (autoRetry) {
						console.log('[!] Freebox OS returned a null sessionToken. Trying again...')
						setTimeout(function() {
							freeboxRequest(method, url, body, auth, requestCallback, authCallback)
						}, RETRY_TIMEOUT)
						return
					} else {
						console.log('[!] Freebox OS returned null sessionToken.')
						requestCallback(401, null)
						return
					}
				}
				authCallback(new_sessionToken, body.result.challenge)
				let new_auth = {
					challenge: body.result.challenge,
					session: new_sessionToken,
					token: auth.token,
					trackId: auth.trackId
				}
				freeboxRequest(method, url, body, new_auth, requestCallback, authCallback)
			})
		} else {
			if(body.error_code != null && body.error_code == 'insufficient_rights') {
				if (autoRetry) {
					console.log('[!] Insufficient rights to request home api ('+body.missing_right+'). Trying again...')
					setTimeout(function() {
						freeboxRequest(method, url, body, auth, requestCallback, authCallback)
					}, RETRY_TIMEOUT)
				} else {
					console.log('[!] Insufficient rights to request home api.')
					requestCallback(401, null)
				}
			} else if(body.success == false) {
				setTimeout(function() {
					if(RETRY_COUNT < 3) {
						freeboxRequest(method, url, body, auth, requestCallback, authCallback)
						RETRY_COUNT++
					} else {
						requestCallback(401, null)
						RETRY_COUNT = 0
						return
					}
				}, RETRY_TIMEOUT)
			} else {
				requestCallback(response.statusCode, body)
			}
		}
	})
}

module.exports.basicRequest = basicRequest
module.exports.freeboxRequest = freeboxRequest
