let router = require('express').Router()
let fbxHome = require('./../fbx-home/fbx-home')
let fbxAuth = require('./../fbx-auth/session')
let envManager = require('./../fbx-auth/env-manager')
let homebridge = require('./../homebridge-config/setup')
let Logs = require('./../log')

const RETRY_TIMEOUT = 2000 // 2 seconds


require('dotenv').config()

var token = process.env.TOKEN
var trackId = process.env.TRACK
var camEnabled = false

function freeboxAuthPairing(callback) {
	console.log('[i] Start init sequece')
	fbxAuth.fbx(token, trackId, (new_token, new_sessionToken, new_trackId, new_challenge) => {
		if(new_token != null && new_sessionToken != null) {
			envManager.update(new_token, new_trackId, (success) => {
				updateAuth(new_sessionToken, new_challenge, new_token, new_trackId)
				callback(success)
			})
		} else {
			if(token != null && trackId != null) {
				console.log('[!] Unable to authorize app with current token')
				console.log('[!] Requesting new token...')
				token = null
				trackId = null
				setTimeout(function() {
					freeboxAuthPairing(callback)
				}, RETRY_TIMEOUT)
			} else {
				console.log('[i] Unable to start server - trung again...')
				setTimeout(function() {
					freeboxAuthPairing(callback)
				}, RETRY_TIMEOUT)
			}
		}
	})
}

router.get('/fbx/auth', function(req, res) {
	freeboxAuthPairing((success) => {
		res.status(200)
		res.send(success)
	})
})

router.get('/fbx/rights', function(req, res) {
	fbxHome.testHomeCapabilities((success) => {
		res.status(200)
		res.send(success)
	})
})

router.get('/homebridge/restart', function(req, res) {
	homebridge.reloadHomebridge((success) => {
		res.status(200)
		res.send(success)
	})
})

router.get('/homebridge/conf', function(req, res) {
	homebridge.camEnabled = camEnabled
	homebridge.setupHomebridge(false, (success) => {
		res.status(200)
		res.send(success)
	})
})

router.get('/homebridge/conf/alarm', function(req, res) {
	homebridge.camEnabled = camEnabled
	homebridge.setupHomebridge(true, (success) => {
		res.status(200)
		res.send(success)
	})
})

router.get('/homebridge/clean', function(req, res) {
	homebridge.cleanHomebridge((success) => {
		res.status(200)
		res.send(success)
	})
})

// List all nodes
router.get('/node/list', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.getNodeList(null, (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get the status of a given node (by id)
router.get('/node/:id', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	let nodeId = parseInt(req.params.id, 10)
	fbxHome.nodeStatus(nodeId, (status) => {
		if(status != null) {
			res.status(200)
			res.send(status.toString())
		} else {
			res.status(400)
			res.send(null)
		}
	})
})

// Get all the contact sensors ids
router.get('/node/list/contactSensor', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.getNodeList("dws", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get all the motion sensors ids
router.get('/node/list/motionSensor', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.getNodeList("pir", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Activate the main alarm
router.post('/alarm/main', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.activateMainAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Activate the secondary alarm
router.post('/alarm/secondary', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.activateSecondaryAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Dectivate all alarms
router.post('/alarm/off', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.deactivateAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Dectivate all alarms as well
router.post('/alarm/home', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.homeAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Get the state of the alarm
router.post('/alarm/state', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.alarmState((state, target) => {
		var value = null
		switch(state) {
			case 'idle':
				if(target == 3) {
					value = 0
				} else {
					value = 3
				}
				break
			case 'alarm1_armed':
				value = 1
				break
			case 'alarm2_armed':
				value = 2
				break
			case 'alert':
				value = 4
				break
			default:
				value = 0
				break
		}
		res.status((state != null || value == 5) ? 200 : 400)
		res.send(value.toString())
	})
})

// Get the target state of the alarm
router.post('/alarm/target', function(req, res) {
	if (req.headers.host != 'localhost:8888') {
		res.status(401)
		res.send('unauthorized')
		return
	}
	fbxHome.alarmTargetState((state) => {
		if(state == null) {
				res.status(400)
				res.send(null)
		} else {
				var value = 0
				switch(state) {
						case 0:
								value = 3
						case 1:
								value = 1
						case 2:
								value = 2
						case 3:
								value = 0
				}
				res.status(200)
				res.send(value.toString())
		}
	})
})

router.get('/ping', function(req, res) {
	res.status(200)
	res.send("OK")
})

router.get('/log/homebridge/error', function(req, res) {
	let hbLogs = new Logs()
	hbLogs.getHomebridgeErrorLogs((logs) => {
		res.status(200)
		res.send(logs)
	})
})

router.get('/log/homebridge', function(req, res) {
	let hbLogs = new Logs()
	hbLogs.getHomebridgeLogs((logs) => {
		res.status(200)
		res.send(logs)
	})
})

router.get('/log/server/error', function(req, res) {
	let hbLogs = new Logs()
	hbLogs.getServerErrorLogs((logs) => {
		res.status(200)
		res.send(logs)
	})
})

router.get('/log/server', function(req, res) {
	let hbLogs = new Logs()
	hbLogs.getServerLogs((logs) => {
		res.status(200)
		res.send(logs)
	})
})

// To notify the controller with new auth data
function updateAuth(new_session, new_challenge, token, trackId) {
	fbxHome.updateAuth(new_session, new_challenge, token, trackId)
}

module.exports.router = router
module.exports.updateAuth = updateAuth
module.exports.freeboxAuthPairing = freeboxAuthPairing