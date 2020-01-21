let request = require('request')
let fbxAuth = require('./../fbx-auth/session')

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
		callback(response.statusCode, response.body)
	})
}

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
function freeboxRequest(method, url, body, auth, requestCallback, authCallback) {
	//console.log('X-Fbx-App-Auth '+auth.session)
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
		// if the challenge has changed -> request new session token
		// returns the new auth stuff and retry the request
		if ((body.error_code != null && body.error_code == 'auth_required') && auth.challenge != body.result.challenge) {
			fbxAuth.session(auth.token, body.result.challenge, (new_sessionToken) => {
				authCallback(new_sessionToken, body.result.challenge)
				let new_auth = {
					challenge: body.result.challenge,
					sessionToken: new_sessionToken,
					token: auth.token,
					trackId: auth.trackId
				}
				freeboxRequest(method, url, body, new_auth, requestCallback, authCallback)
			})
		} else {
			requestCallback(response.statusCode, body)
		}
	})
}

module.exports.basicRequest = basicRequest
module.exports.freeboxRequest = freeboxRequest
