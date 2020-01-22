let express = require('express')
let fbxAuth = require('./fbx-auth/session')
let envManager = require('./fbx-auth/env-manager')
let apiRoutes = require('./routes/api-routes')

require('dotenv').config()

process.title = "FBX-HOME-API"

const port = 8888

const token = process.env.TOKEN
const trackId = process.env.TRACK

let app = express()

app.listen(port, function () {
	console.log('[-] Running on port : 8888')
	console.log('[i] Start init sequece')
	fbxAuth.fbx(token, trackId, (new_token, new_sessionToken, new_trackId, new_challenge) => {
		if(new_token != null && new_sessionToken != null) {
			envManager.update(new_token, new_trackId, (success) => {
				apiRoutes.updateAuth(new_sessionToken, new_challenge, new_token, new_trackId)
				app.use('/api', apiRoutes.router)
			})
		} else {
			console.log('[!] Unable to authorize app - shutting down')
			app.close()
		}
	})
})