let express = require('express')
let fbxAuth = require('./fbx-auth/session')
let envManager = require('./fbx-auth/env-manager')

require('dotenv').config()

var port = process.env.PORT
var token = process.env.TOKEN
var trackId = process.env.TRACK

let app = express()

app.listen(port, function () {
	console.log('[-] Running on port : '+port)
	console.log('[i] Start init sequece')
	fbxAuth.fbx(token, trackId, (new_token, new_sessionToken, new_trackId, new_challenge) => {
		if(new_token != null && new_sessionToken != null) {
			envManager.update(new_token, new_trackId, (success) => {
				console.log('Lgtm')
			})
		} else {
			console.log('[!] Unable to authorize app - shutting down')
			app.close()
		}
	})
})