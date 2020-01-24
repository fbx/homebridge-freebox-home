let express = require('express')
let fbxAuth = require('./fbx-auth/session')
let envManager = require('./fbx-auth/env-manager')
let apiRoutes = require('./routes/api-routes')

let homebridge = require('./homebridge-config/setup')

require('dotenv').config()

process.title = "FBX-HOME-API"

const port = 8888

var token = process.env.TOKEN
var trackId = process.env.TRACK

let app = express()

let server = app.listen(port, function () {
	console.log('[-] Running on port : 8888')
	serverStart((success) => {
		if(success) {
			console.log('[i] Server is up and running')
		} else {
			console.log('[i] Unable to start server - shutting down')
			server.close()
		}
	})
})

const RETRY_TIMEOUT = 2000 // 2 seconds

function serverStart(callback) {
	console.log('[i] Start init sequece')
	fbxAuth.fbx(token, trackId, (new_token, new_sessionToken, new_trackId, new_challenge) => {
		if(new_token != null && new_sessionToken != null) {
			envManager.update(new_token, new_trackId, (success) => {
				apiRoutes.updateAuth(new_sessionToken, new_challenge, new_token, new_trackId)
				app.use('/api', apiRoutes.router)
				homebridge.setupHomebridge((hb_success) => {
					if(!hb_success) {
						console.log('[!] Unable to setup homebridge config')
						callback(false)
					} else {
						callback(true)
					}
				})
			})
		} else {
			if(token != null && trackId != null) {
				console.log('[!] Unable to authorize app with current token')
				console.log('[!] Requesting new token...')
				token = null
				trackId = null
				setTimeout(function() {
					serverStart(callback)
				}, RETRY_TIMEOUT)
			} else {
				console.log('[i] Unable to start server - trung again...')
				setTimeout(function() {
					serverStart(callback)
				}, RETRY_TIMEOUT)
			}
		}
	})
}