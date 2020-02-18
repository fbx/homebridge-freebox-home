let express = require('express')
let apiRoutes = require('./routes/api-routes')

let homebridge = require('./homebridge-config/setup')

let fs = require('fs')

require('dotenv').config()

process.title = "homebridge-freebox-home"

const port = 8888

let app = express()
var autoAuth = checkAutoAuth(process.argv)
setupEnvFile()
let server = app.listen(port, function () {
	console.log('[-] Running on port : 8888')
	if (autoAuth) {
		freeboxAuth((success) => {
			if (success) {
				startServer()
			} else {
				shutdown(server)
			}
		})
	} else {
		startServer()
	}
})

function startServer() {
	app.use('/api', apiRoutes.router)
	apiRoutes.camEnabled = checkCamEnabled(process.argv)
}

function shutdown(server) {
	if (server != null) {
		console.log('[i] Unable to pair with Freebox - shutting down')
		server.close()
	}
}

function freeboxAuth(callback) {
	apiRoutes.freeboxAuthPairing((success) => {
		if (success) {
			homebridge.setupHomebridge((success) => {
				if (success) {
					homebridge.reloadHomebridge((success) => {
						callback(true)
					})
				} else {
					callback(false)
				}
			})
		} else {
			callback(false)
		}
	})
}

function setupEnvFile() {
	let file = './.env'
	fs.exists(file, function (exists) {
		if(!exists) {
			let data = 'TOKEN=null\nTRACK=null'
			fs.writeFile('./.env', data, (err) => {
				console.log("[-] Created env file")
			})
		}
	})
}

function checkAutoAuth(args) {
	for (arg of args) {
		if (arg == 'auto-auth') {
			return true
		}
	}
	return false
}

function checkCamEnabled(args) {
	for (arg of args) {
		if (arg == 'cam') {
			return true
		}
	}
	return false
}