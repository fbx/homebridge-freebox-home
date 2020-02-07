let router = require('express').Router()
let fbxHome = require('./../fbx-home/fbx-home')
let homebridge = require('./../homebridge-config/setup')

// List all nodes
router.get('/node/list', function(req, res) {
	fbxHome.getNodeList(null, (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get the status of a given node (by id)
router.get('/node/:id', function(req, res) {
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
	fbxHome.getNodeList("dws", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get all the motion sensors ids
router.get('/node/list/motionSensor', function(req, res) {
	fbxHome.getNodeList("pir", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Activate the main alarm
router.post('/alarm/main', function(req, res) {
	fbxHome.activateMainAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Activate the secondary alarm
router.post('/alarm/secondary', function(req, res) {
	fbxHome.activateSecondaryAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Dectivate all alarms
router.post('/alarm/off', function(req, res) {
	fbxHome.deactivateAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Dectivate all alarms as well
router.post('/alarm/home', function(req, res) {
	fbxHome.homeAlarm((success) => {
		res.status(success ? 200 : 400)
		res.send(null)
	})
})

// Get the state of the alarm
router.post('/alarm/state', function(req, res) {
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

router.get('/homebridge/reload', function(req, res) {
	homebridge.reloadHomebridge((success) => {
		res.status(200)
		res.send(success)
	})
})

// To notify the controller with new auth data
function updateAuth(new_session, new_challenge, token, trackId) {
	fbxHome.updateAuth(new_session, new_challenge, token, trackId)
}

module.exports.router = router
module.exports.updateAuth = updateAuth