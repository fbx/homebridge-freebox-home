let router = require('express').Router()
let fbxHome = require('./../fbx-home/fbx-home')

require('dotenv').config()

// List all nodes
router.get('/node/list', function(req, res) {
	fbxHome.nodeList(null, (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get the status of a given node (by id)
router.get('/node/:id', function(req, res) {
	let nodeId = parseInt(req.params.id, 10)
	fbxHome.nodeStatus(nodeId, (status) => {
		res.status(200)
		res.json({value: status})
	})
})

// Get all the contact sensors ids
router.get('/node/list/contactSensor', function(req, res) {
	fbxHome.nodeList("dws", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Get all the motion sensors ids
router.get('/node/list/motionSensor', function(req, res) {
	fbxHome.nodeList("pir", (list) => {
		res.status(200)
		res.json(list)
	})
})

// Activate the main alarm
router.post('/alarm/main', function(req, res) {
	fbxHome.activateMainAlarm((success) => {
		res.status(success ? 200 : 400)
		res.json({})
	})
})

// Activate the secondary alarm
router.post('/alarm/secondary', function(req, res) {
	fbxHome.activateSecondaryAlarm((success) => {
		res.status(success ? 200 : 400)
		res.json({})
	})
})

// Dectivate all alarms
router.post('/alarm/off', function(req, res) {
	fbxHome.deactivateAlarm((success) => {
		res.status(success ? 200 : 400)
		res.json({})
	})
})

// Get the state of the alarm
router.post('/alarm/state', function(req, res) {
	fbxHome.alarmState((state) => {
		res.status((state != null) ? 200 : 400)
		res.json({ value: state})
	})
})

// Get the target state of the alarm
router.post('/alarm/target', function(req, res) {
	fbxHome.alarmTargetState((state) => {
		res.status((state != null) ? 200 : 400)
		res.json({ value: state})
	})
})

// To notify the controller with new auth data
function updateAuth(new_session, new_challenge, token, trackId) {
	fbxHome.updateAuth(new_session, new_challenge, token, trackId)
}

module.exports.router = router
module.exports.updateAuth = updateAuth